import { ErrorResponse } from '@utils/errorResponse';
import { IAbsence, IAbsenceCreateDTO, IAbsenceUpdateDTO, IAbsenceReportParams } from './absence.interface';
import { IUser } from '@components/users/user.interface';
import { logger } from '@utils/logger';
import Absence from './absence.model';
import User from '@components/users/user.model';
import Taxi from '@components/taxi/taxi.model';
import Session from '@components/sessions/session.model';
import Classroom from '@components/classrooms/classroom.model';

class AbsenceService {
  async getAbsences(query: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const absences = await Absence.find({
      date: {
        $gte: yesterday,
        $lt: dayAfterTomorrow,
      },
    }).populate([
      {
        path: 'student',
        model: User,
        select: 'firstname lastname email phone user_type name',
      },
      {
        path: 'session',
        model: Session,
        select: 'start_date end_date taxi classroom',
        populate: [
          { path: 'taxi', select: 'name', model: Taxi },
          { path: 'classroom', select: 'name location', model: Classroom },
        ],
      },
      { path: 'taxi', model: Taxi, select: 'name' },
    ]);

    return absences;
  }

  async getAbsence(id: string) {
    const absence = await Absence.findById(id)
      .populate({
        path: 'student',
        select: 'firstname lastname email phone user_type name',
        model: User,
      })
      .populate({
        path: 'session',
        select: 'start_date end_date taxi classroom',
        populate: [
          { path: 'taxi', select: 'name', model: Taxi },
          { path: 'classroom', select: 'name location', model: Classroom },
        ],
        model: Session,
      })
      .populate({ path: 'taxi', select: 'name', model: Taxi })
      .populate('academic_period');

    if (!absence) {
      throw new ErrorResponse(`Absence not found with id of ${id}`, 404);
    }

    return absence;
  }

  async createAbsence(absenceData: IAbsenceCreateDTO) {
    const student = await User.findById(absenceData.student);

    if (!student) {
      throw new ErrorResponse(`Student not found with id of ${absenceData.student}`, 404);
    }

    return await Absence.create(absenceData);
  }

  async updateAbsence(id: string, absenceData: IAbsenceUpdateDTO) {
    let absence = await Absence.findById(id);

    if (!absence) {
      throw new ErrorResponse(`Absence not found with id of ${id}`, 404);
    }

    absence = await Absence.findByIdAndUpdate(id, absenceData, {
      new: true,
      runValidators: true,
    });

    return absence;
  }

  async deleteAbsence(id: string) {
    const absence = await Absence.findById(id);

    if (!absence) {
      throw new ErrorResponse(`Absence not found with id of ${id}`, 404);
    }

    await absence.deleteOne();
    return;
  }

  async getAbsenceReport(params: IAbsenceReportParams) {
    const query: any = {};

    if (params.start_date && params.end_date) {
      query.date = {
        $gte: new Date(params.start_date),
        $lte: new Date(params.end_date),
      };
    } else if (params.start_date) {
      query.date = { $gte: new Date(params.start_date) };
    } else if (params.end_date) {
      query.date = { $lte: new Date(params.end_date) };
    }

    if (params.student_id) {
      query.student = params.student_id;
    }

    if (params.taxi_id) {
      query.taxi = params.taxi_id;
    }

    if (params.academic_period_id) {
      query.academic_period = params.academic_period_id;
    }

    if (params.status) {
      query.status = params.status;
    }

    const absences = await Absence.find(query)
      .populate({
        path: 'student',
        select: 'firstname lastname name email phone',
        model: User,
      })
      .populate({
        path: 'taxi',
        select: 'name color branch subject level',
        model: Taxi,
      })
      .populate({
        path: 'session',
        select: 'start_date end_date classroom',
        populate: {
          path: 'classroom',
          select: 'name location',
          model: Classroom,
        },
        model: Session,
      })
      .populate('academic_period')
      .sort({ date: -1 });

    const report = absences.reduce((acc: any, absence: IAbsence) => {
      const student = absence.student as IUser;

      if (!acc[student.id]) {
        acc[student.id] = {
          student: {
            id: student.id,
            name: `${student.firstname} ${student.lastname}`,
          },
          absences: [],
          total: 0,
          excused: 0,
          unexcused: 0,
        };
      }

      acc[student.id].absences.push(absence);
      acc[student.id].total += 1;

      if (absence.status === 'excused' || absence.status === 'justified') {
        acc[student.id].excused += 1;
      } else {
        acc[student.id].unexcused += 1;
      }

      return acc;
    }, {});

    return Object.values(report);
  }

  async notifyParent(id: string) {
    const absence = await Absence.findById(id)
      .populate({ path: 'student', select: 'firstname lastname email' })
      .populate({ path: 'taxi', select: 'name' });

    if (!absence) {
      throw new ErrorResponse(`Absence not found with id of ${id}`, 404);
    }

    const student = absence.student as IUser;

    try {
      const message = `Your child ${student.firstname} ${student.lastname} was absent from ${absence.taxi} class on ${absence.date.toLocaleDateString()}.`;

      logger.info(`Notification would be sent: ${message}`);

      absence.notified_parent = true;
      absence.notification_date = new Date();
      await absence.save();

      return absence;
    } catch (err: any) {
      logger.error(`Error sending absence notification: ${err.message}`);
      throw new ErrorResponse('Failed to send notification', 500);
    }
  }
}

export default new AbsenceService();
