import { Document, Schema } from 'mongoose';

export interface ICustomActivity extends Document {
  activityType: Schema.Types.String;
  typeString: Schema.Types.String;
  playerMode: Schema.Types.String;
  playerModeString: Schema.Types.String;
  title: Schema.Types.String;
  description: Schema.Types.String;
  template: Schema.Types.String;
  userId: Schema.Types.ObjectId;
  cefr: Schema.Types.String;
  tags: [
    {
      label: Schema.Types.String;
      value: Schema.Types.String;
    },
  ];
  settings: Schema.Types.Map;
  of: Boolean;
  questions: any;
}

export interface IAssignedCustomActivity extends ICustomActivity {
  students: Array<Object>;
  classId: Schema.Types.ObjectId;
  assignmentBundle: Schema.Types.String;
}
/*
export interface IClozeActivity {
  questions: {
    document: string;
    answers: string[];
    imageURL?: string;
  }[];
}

export interface IFillInTheGaps {
  questions: {
    id?: number;
    questionNumber: number;
    imageURL?: string;
    document: string;
    distractors: string[];
    answers: string[];
  }[];
}

export interface IGroupSort {
  questions: {
    id?: number;
    groupNumber: number;
    groupName: string;
    imageURL?: string;
    items: {
      id: number;
      groupNumber: number;
      itemNumber: number;
      answer: {
        imageURL?: string;
        TTSText?: string;
        answerText: string;
      };
    }[];
  }[];
}

export interface ILetterHunt {
  questions: {
    id?: number;
    questionNumber: number;
    answers: {
      imageURL?: string;
      TTSText?: string;
      answerText: string;
    }[];
  }[];
}

export interface IMatchingPairs {
  questions: {
    id?: number;
    questionNumber: number;
    answers: {
      item1: {
        imageURL?: string;
        TTSText?: string;
        answerText?: string;
      };
      item2: {
        imageURL?: string;
        TTSText?: string;
        answerText?: string;
      };
    }[];
  }[];
}

export interface IMemoryMatchingPairs {
  questions: {
    id?: number;
    questionNumber: number;
    option?: string;
    answers: {
      item1: {
        imageURL?: string;
        TTSText?: string;
        answerText?: string;
      };
      item2: {
        imageURL?: string;
        TTSText?: string;
        answerText?: string;
      };
    }[];
  }[];
}

export interface IMultipleChoiceQuiz {
  questions: {
    questionNumber: string;
    imageURL?: string;
    TTSText?: string;
    questionText: string;
    answers: {
      answerNumber: number;
      isCorrect: boolean;
      imageURL?: string;
      TTSText?: string;
      answerText: string;
      label: string;
    }[];
  }[];
}

export interface IWordOrder {
  questions: {
    id?: number;
    questionNumber: number;
    option: string;
    answers: {
      imageURL?: string;
      answerText: string;
    }[];
  }[];
}*/
