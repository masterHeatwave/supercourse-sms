export interface ValidationObject {
  isValid: boolean;
  reason: string;
}

export interface SaveResponse {
  id: string;
}

export interface Answer {
  item1?: AnswerItem;
  item2?: AnswerItem;
  answerNumber?: number;
  label?: string;
  isCorrect?: boolean;
  imageURL: string;
  TTSText?: string;
  answerText: string;
}

export interface AnswerItem {
  imageURL: string;
  TTSText?: string;
  answerText: string;
  isCorrect?: boolean;
  label?: string;
}

export type SimplifiedAnswer = Omit<
  Answer,
  'label' | 'isCorrect' | 'answerNumber'
>;

export interface Question {
  id: number;
  questionNumber: number;
  imageURL: string;
  TTSText: string;
  questionText: string;
  answers: Answer[];
  option?: string;
  document?: string;
  groupNumber?: number;
  groupName?: string;
  items?: Item[];
}

export interface Item {
  group: number;
  itemNumber: number;
  answer: {
    imageURL: string;
    TTSText: string;
    answerText: string;
  };
}

export type SingleAnswerQuestion = Omit<Question, 'answers'> & {
  answers: SimplifiedAnswer;
};
