import { Document, Schema } from 'mongoose';

export interface IMood extends Document {
  userId: Schema.Types.ObjectId;
  taxisId: Schema.Types.ObjectId;
  academic_subperiod: Schema.Types.ObjectId;
  mood: string;
  date: Date;
}

export interface IMoodVideo extends Document {
  source: Schema.Types.String;
  title: Schema.Types.String;
  type: Schema.Types.String;
  viewCount: Schema.Types.Number;
}

/*export interface IMoodCreateDTO {
	userId: Schema.Types.ObjectId;
	taxisId: Schema.Types.ObjectId;
	academic_subperiod: Schema.Types.ObjectId;
	mood: string;
	date: Date;
}

export interface IMoodUpdateDTO {
	id: Schema.Types.ObjectId;
	userId: Schema.Types.ObjectId;
	taxisId: Schema.Types.ObjectId;
	academic_subperiod: Schema.Types.ObjectId;
	mood: string;
	date: Date;
}*/
