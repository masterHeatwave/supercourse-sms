import 'zod-openapi/extend';
import { z } from 'zod';

export const BaseActivitySchema = z
  .object({
    activityType: z.string(),
    typeString: z.string(),
    playerMode: z.string(),
    playerModeString: z.string(),
    title: z.string(),
    description: z.string().optional(),
    template: z.string(),
    templateURL: z.string(),
    userId: z.string(),
    cefr: z.string(),
    tags: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
        })
      )
      .optional(),
    settings: z.record(z.boolean()).optional(),
    questions: z.array(z.any()).nonempty({ message: 'Questions array cannot be empty' }),
  })
  .openapi({
    title: 'Custom activity',
    description: 'Custom activity model',
  });

export const ClozeSchema = z
  .object({
    questions: z.array(
      z.object({
        document: z.string(),
        answers: z.array(z.string()),
        imageURL: z.string().optional(),
      })
    ),
  })
  .openapi({
    title: 'Cloze activity',
    description: 'Cloze activity model',
  });

export const FillInTheGapsSchema = z
  .object({
    questions: z.array(
      z.object({
        id: z.number().optional(),
        questionNumber: z.number(),
        imageURL: z.string().optional(),
        document: z.string(),
        distractors: z.array(z.string()).optional(),
        answers: z.array(z.string()),
      })
    ),
  })
  .openapi({
    title: 'Fill in the gaps activity',
    description: 'Fill in the gaps activity model',
  });

export const GroupSortSchema = z
  .object({
    questions: z.array(
      z.object({
        id: z.number().optional(),
        groupNumber: z.number(),
        groupName: z.string(),
        imageURL: z.string().optional(),
        items: z.array(
          z.object({
            groupNumber: z.number(),
            itemNumber: z.number(),
            answer: z.object({
              imageURL: z.string().optional(),
              TTSText: z.string().optional(),
              answerText: z.string(),
            }),
          })
        ),
      })
    ),
  })
  .openapi({
    title: 'Group sort activity',
    description: 'Group sort activity model',
  });

export const LetterHuntSchema = z
  .object({
    questions: z.array(
      z.object({
        id: z.number().optional(),
        questionNumber: z.number(),
        answers: z.object({
          imageURL: z.string().optional(),
          TTSText: z.string().optional(),
          answerText: z.string(),
        }),
      })
    ),
  })
  .openapi({
    title: 'Letter hunt activity',
    description: 'Letter hunt activity model',
  });

const ItemSchema = z.object({
  imageURL: z.string().optional(),
  TTSText: z.string().optional(),
  answerText: z.string(),
});

export const MatchingPairsSchema = z
  .object({
    questions: z.array(
      z.object({
        id: z.number().optional(),
        questionNumber: z.number(),
        answers: z.array(
          z.object({
            item1: ItemSchema,
            item2: ItemSchema,
          })
        ),
      })
    ),
  })
  .openapi({
    title: 'Matching pairs activity',
    description: 'Matching pairs activity model',
  });

export const MemoryMatchingPairsSchema = z
  .object({
    questions: z.array(
      z.object({
        id: z.number().optional(),
        questionNumber: z.number(),
        option: z.string().optional(),
        answers: z.array(
          z.object({
            item1: ItemSchema,
            item2: ItemSchema,
          })
        ),
      })
    ),
  })
  .openapi({
    title: 'Memory matching pairs activity',
    description: 'Memory matching pairs activity model',
  });

export const MultipleChoiceQuizSchema = z
  .object({
    questions: z.array(
      z.object({
        id: z.number().optional(),
        questionNumber: z.number(),
        imageURL: z.string().optional(),
        TTSText: z.string().optional(),
        questionText: z.string(),
        answers: z.array(
          z.object({
            answerNumber: z.number(),
            isCorrect: z.boolean(),
            imageURL: z.string().optional(),
            TTSText: z.string().optional(),
            answerText: z.string(),
            label: z.string(),
          })
        ),
      })
    ),
  })
  .openapi({
    title: 'Multiple choice quiz activity',
    description: 'Multiple choice quiz activity model',
  });

export const WordOrderSchema = z
  .object({
    questions: z.array(
      z.object({
        id: z.number().optional(),
        questionNumber: z.number(),
        option: z.string(),
        answers: z.array(
          z.object({
            imageURL: z.string().optional(),
            answerText: z.string(),
          })
        ),
      })
    ),
  })
  .openapi({
    title: 'Word order activity',
    description: 'Word order activity model',
  });

export const ClozeActivitySchema = BaseActivitySchema.extend({
  activityType: z.literal('cloze'),
  questions: ClozeSchema.shape.questions,
});

export const FillInTheGapsActivitySchema = BaseActivitySchema.extend({
  activityType: z.literal('fillInTheGaps'),
  questions: FillInTheGapsSchema.shape.questions,
});

export const GroupSortActivitySchema = BaseActivitySchema.extend({
  activityType: z.literal('groupSort'),
  questions: GroupSortSchema.shape.questions,
});

export const LetterHuntActivitySchema = BaseActivitySchema.extend({
  activityType: z.literal('letterHunt'),
  questions: LetterHuntSchema.shape.questions,
});

export const MatchingPairsActivitySchema = BaseActivitySchema.extend({
  activityType: z.literal('matchingPairs'),
  questions: MatchingPairsSchema.shape.questions,
});

export const MemoryMatchingPairsActivitySchema = BaseActivitySchema.extend({
  activityType: z.literal('memoryMatchingPairs'),
  questions: MemoryMatchingPairsSchema.shape.questions,
});

export const MultipleChoiceQuizActivitySchema = BaseActivitySchema.extend({
  activityType: z.literal('multipleChoiceQuiz'),
  questions: MultipleChoiceQuizSchema.shape.questions,
});

export const WordOrderActivitySchema = BaseActivitySchema.extend({
  activityType: z.literal('wordOrder'),
  questions: WordOrderSchema.shape.questions,
});

export const CustomActivitySchema = z
  .discriminatedUnion('activityType', [
    ClozeActivitySchema,
    FillInTheGapsActivitySchema,
    GroupSortActivitySchema,
    LetterHuntActivitySchema,
    MatchingPairsActivitySchema,
    MemoryMatchingPairsActivitySchema,
    MultipleChoiceQuizActivitySchema,
    WordOrderActivitySchema,
  ])
  .openapi({
    title: 'Create Custom Activity',
    description: 'A union of all possible activity types validated by the activityType discriminator key',
  });
