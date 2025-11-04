import { IAdvancedResultsOptions, IAdvancedResultsModel } from '@plugins/advancedResults.interface';
import { IRoleCreateDTO } from './role.interface.js';
import Role from './role.model';
import { IRole } from './role.interface';
import { Model } from 'mongoose';

type ContextRoleModel = Model<IRole> & IAdvancedResultsModel<IRole>;

const queryAll = async (params: IAdvancedResultsOptions) => {
  return await (Role as ContextRoleModel).advancedResults({
    page: params.page,
    limit: params.limit,
    sort: params.sort,
    select: params.select,
    populate: params.populate,
    query: params.query,
  });
};

const querySingle = async (id: string) => {
  return await Role.findById(id);
};

const queryByTitle = async (title: string) => {
  return await Role.findOne({ title });
};

const create = async (data: IRoleCreateDTO) => {
  return await Role.create(data);
};

const genCustomRoleName = () => {
  const randomHash = Math.random().toString(36).substring(7);
  return `CUSTOM_${randomHash}`;
};

export default {
  queryAll,
  querySingle,
  create,
  queryByTitle,
  genCustomRoleName,
};
