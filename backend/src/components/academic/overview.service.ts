import AcademicYear from '@components/academic/academic-years.model';
import AcademicPeriod from '@components/academic/academic-periods.model';
import Taxi from '@components/taxi/taxi.model';
import Customer from '@components/customers/customer.model';
import User from '@components/users/user.model';
import Role from '@components/roles/role.model';
import { IAcademicOverviewYear, IAcademicOverviewPeriod, IAcademicOverviewUserRole } from './overview.interface';

export class AcademicOverviewService {
  async getOverview(): Promise<IAcademicOverviewYear[]> {
    const years = await AcademicYear.find().sort({ start_date: -1 }).lean();

    const result: IAcademicOverviewYear[] = [] as any;

    for (const year of years) {
      const periods = await AcademicPeriod.find({ academic_year: year._id }).sort({ start_date: 1 }).lean();

      const periodDtos: IAcademicOverviewPeriod[] = [];

      for (const period of periods) {
        // Find classes (taxis) for the period
        const taxis = await Taxi.find({ academic_year: year._id, academic_period: period._id })
          .select('name branch users')
          .lean();

        // Resolve branches
        const branchIds = Array.from(new Set(taxis.map((t) => String(t.branch)).filter(Boolean)));
        const branches: any[] = branchIds.length
          ? await Customer.find({ _id: { $in: branchIds } })
              .select('name address')
              .lean()
          : [];

        // Resolve teacher users for those taxis (role/user_type)
        const userIds = Array.from(new Set(taxis.flatMap((t) => (t.users as any[]) || []).map((u) => String(u))));

        const users = userIds.length
          ? await User.find({ _id: { $in: userIds } })
              .select('firstname lastname roles role_title user_type')
              .populate({
                path: 'roles',
                model: Role,
              })
          : [];

        const teachers: IAcademicOverviewUserRole[] = users
          .filter((u: any) => u.user_type === 'teacher')
          .map((u: any) => ({
            userId: String(u._id),
            fullName: `${u.firstname} ${u.lastname}`,
            role: 'TEACHER',
            title: u.role_title || (u.roles?.[0]?.title ?? undefined),
          }));

        // Collect administrators/managers for the branches if available via customer fields
        const adminAndManagers: IAcademicOverviewUserRole[] = [];
        for (const br of branches as any[]) {
          const fullBranch: any = await Customer.findById(br._id).populate(['administrator', 'manager']).lean();
          if (fullBranch && fullBranch.administrator) {
            const a: any = fullBranch.administrator;
            adminAndManagers.push({
              userId: String(a._id),
              fullName: `${a.firstname} ${a.lastname}`,
              role: 'ADMIN',
              title: a.role_title || 'Headmaster',
            });
          }
          if (fullBranch && fullBranch.manager) {
            const m: any = fullBranch.manager;
            adminAndManagers.push({
              userId: String(m._id),
              fullName: `${m.firstname} ${m.lastname}`,
              role: 'MANAGER',
              title: m.role_title || 'Manager',
            });
          }
        }

        // Map classes
        const classes = taxis.map((t) => ({ id: String(t._id), name: t.name }));

        periodDtos.push({
          id: String(period._id),
          name: period.name,
          start_date: period.start_date as unknown as Date,
          end_date: period.end_date as unknown as Date,
          branches: branches.map((b) => ({ id: String(b._id), name: b.name, address: b.address })),
          classes,
          roles: {
            administrators: adminAndManagers.filter((r) => r.role === 'ADMIN'),
            managers: adminAndManagers.filter((r) => r.role === 'MANAGER'),
            teachers,
          },
        });
      }

      result.push({
        id: String(year._id),
        name: year.name,
        start_date: year.start_date as unknown as Date,
        end_date: year.end_date as unknown as Date,
        periods: periodDtos,
      } as any);
    }

    return result;
  }

  async getOverviewForUser(userId: string): Promise<IAcademicOverviewYear[]> {
    const years = await AcademicYear.find().sort({ start_date: -1 }).lean();
    const result: IAcademicOverviewYear[] = [] as any;

    for (const year of years) {
      const periods = await AcademicPeriod.find({ academic_year: year._id }).sort({ start_date: 1 }).lean();

      const periodDtos: IAcademicOverviewPeriod[] = [];

      for (const period of periods) {
        // Find classes (taxis) for the period where the user participates
        const taxis = await Taxi.find({ academic_year: year._id, academic_period: period._id, users: userId })
          .select('name branch users')
          .lean();

        // If user is not related to any taxi in this period, still include branch/role context via branch roles
        const branchIds = Array.from(new Set(taxis.map((t) => String(t.branch)).filter(Boolean)));
        const branches: any[] = branchIds.length
          ? await Customer.find({ _id: { $in: branchIds } })
              .select('name address administrator manager')
              .lean()
          : [];

        // Determine user role in this context
        const user = await User.findById(userId)
          .select('firstname lastname roles role_title user_type branches')
          .populate({ path: 'roles', model: Role })
          .lean();

        const teachers: IAcademicOverviewUserRole[] = [];
        const administrators: IAcademicOverviewUserRole[] = [];
        const managers: IAcademicOverviewUserRole[] = [];

        if (user) {
          const base = {
            userId: String(user._id),
            fullName: `${user.firstname} ${user.lastname}`,
            title: (user as any).role_title || ((user as any).roles?.[0]?.title ?? undefined),
          } as const;

          if ((user as any).user_type === 'teacher') {
            teachers.push({ ...base, role: 'TEACHER' });
          }

          // If user's branches include any of the period branches, consider admin/manager based on branch relations
          const userBranchIds = new Set(((user as any).branches || []).map((b: any) => String(b)));
          for (const br of branches as any[]) {
            if (userBranchIds.has(String(br._id))) {
              if (br.administrator && String(br.administrator) === String(user._id)) {
                administrators.push({ ...base, role: 'ADMIN' });
              }
              if (br.manager && String(br.manager) === String(user._id)) {
                managers.push({ ...base, role: 'MANAGER' });
              }
            }
          }
        }

        const classes = taxis.map((t) => ({ id: String(t._id), name: t.name }));

        // Skip period if no related data for this user
        const hasData = classes.length || administrators.length || managers.length || teachers.length;
        if (!hasData) continue;

        periodDtos.push({
          id: String(period._id),
          name: period.name,
          start_date: period.start_date as unknown as Date,
          end_date: period.end_date as unknown as Date,
          branches: branches.map((b) => ({ id: String(b._id), name: b.name, address: b.address })),
          classes,
          roles: {
            administrators,
            managers,
            teachers,
          },
        });
      }

      if (periodDtos.length) {
        result.push({
          id: String(year._id),
          name: year.name,
          start_date: year.start_date as unknown as Date,
          end_date: year.end_date as unknown as Date,
          periods: periodDtos,
        } as any);
      }
    }

    return result;
  }
}
