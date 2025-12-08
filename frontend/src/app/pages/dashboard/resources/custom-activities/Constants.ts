export const FILL_IN_THE_BLANKS_TEXT = 'Fill in the gaps';
export const FILL_IN_THE_BLANKS_VALUE = 'fillInTheGaps';
export const CLOZE_TEXT = 'Cloze';
export const CLOZE_VALUE = 'cloze';
export const LETTER_HUNT_TEXT = 'Letter hunt';
export const LETTER_HUNT_VALUE = 'letterHunt';
export const MATCHING_PAIRS_TEXT = 'Matching pairs';
export const MATCHING_PAIRS_VALUE = 'matchingPairs';
export const GROUP_SORT_TEXT = 'Group sort';
export const GROUP_SORT_VALUE = 'groupSort';
export const WORD_ORDER_TEXT = 'Word order';
export const WORD_ORDER_VALUE = 'wordOrder';
export const MULTIPLE_CHOICE_QUIZ_TEXT = 'Multiple choice quiz';
export const MULTIPLE_CHOICE_QUIZ_VALUE = 'multipleChoiceQuiz';
export const MEMORY_MATCHING_PAIRS_TEXT = 'Memory matching pairs';
export const MEMORY_MATCHING_PAIRS_VALUE = 'memoryMatchingPairs';

export const SINGLE_PLAYER_MODE_TEXT = 'Single-player';
export const SINGLE_PLAYER_MODE_VALUE = 'singlePlayer';
export const MULTI_PLAYER_MODE_TEXT = 'Multiplayer';
export const MULTI_PLAYER_MODE_VALUE = 'multiplayer';

export const SEPARATE_EACH_WORD = 'separateEachWord';
export const CUSTOM_SEPARATION = 'customSeparation';

export const PAIRS_OF_SAME_ITEM_VALUE = 'pairsOfTheSameItem';
export const PAIRS_OF_SAME_ITEM_TEXT = 'Pairs of the same item';

export const PAIRS_OF_DIFF_ITEM_VALUE = 'pairsOfDifferentItems';
export const PAIRS_OF_DIFF_ITEM_TEXT = 'Pairs of different items';

//settings
export const EACH_SENTENCE_APPEARS_IN_A_SEPARATE_PAGE_OPTION_VALUE = 'eachSentenceAppearsInASeparatePage';
export const ANSWERS_ARE_CASE_SENSITIVE_OPTION_VALUE = 'answersAreCaseSensitive';
export const ALLOW_EXTRA_POINTS_FOR_QUICK_RESPONSES_OPTION_VALUE = 'allowExtraPointsForQuickResponses';
export const NUMBER_ITEMS_OPTION_VALUE = 'numberItems';
export const PUBLIC_OPTION_VALUE = 'public';
export const ANSWERS_ARE_CASE_SENSITIVE_AND_ALLOW_HYPHENATION_OPTION_VALUE = 'answersAreCaseSensitiveAndAllowHyphenation';
export const MATCH_CAPITAL_LETTERS_EXACTLY_VALUE = 'matchCapitalLettersExactly';
export const REQUIRE_HYPHENS_TO_MATCH_VALUE = 'requireHyphensToMatch';
export const SHOW_ANAGRAMS_OPTION_VALUE = 'showAnagrams';
export const HIDE_MATCHED_PAIRS_OPTION_VALUE = 'hideMatchedPairs';
export const NUMBER_THE_PAIRS_OPTION_VALUE = 'numberThePairs';
export const DISPLAY_ALL_ITEMS_FROM_THE_START_OPTION_VALUE = 'displayAllItemsFromTheStart';
export const DISPLAY_ANSWERS_VALUE = 'displayAnswers';
export const RANDOMIZE_ITEMS_OPTION_VALUE = 'randomizeItems';
export const RANDOMIZE_ANSWERS_OPTION_VALUE = 'randomizeAnswers';
export const HIDE_MATCHED_CARDS_OPTION_VALUE = 'hideMatchedCards';
export const NUMBER_THE_BACK_OF_THE_CARDS_OPTION_VALUE = 'numberTheBackOfTheCards';

export const EACH_SENTENCE_APPEARS_IN_A_SEPARATE_PAGE_OPTION_TEXT = 'Each sentence appears in a separate page';
export const ALLOW_EXTRA_POINTS_FOR_QUICK_RESPONSES_OPTION_TEXT = 'Allow extra points for quick responses';
export const NUMBER_ITEMS_OPTION_TEXT = 'Number items';
export const PUBLIC_OPTION_TEXT = 'Public';
export const ANSWERS_ARE_CASE_SENSITIVE_OPTION_TEXT = 'Answers are case-sensitive';
export const ANSWERS_ARE_CASE_SENSITIVE_AND_ALLOW_HYPHENATION_OPTION_TEXT = 'Answers are case-sensitive and allow hyphenation';
export const MATCH_CAPITAL_LETTERS_EXACTLY_TEXT = 'Match capital letters exactly';
export const REQUIRE_HYPHENS_TO_MATCH_TEXT = 'Require hyphens to match';
export const SHOW_ANAGRAMS_OPTION_TEXT = 'Show anagrams';
export const HIDE_MATCHED_PAIRS_OPTION_TEXT = 'Hide matched pairs';
export const NUMBER_THE_PAIRS_OPTION_TEXT = 'Number the pairs';
export const DISPLAY_ALL_ITEMS_FROM_THE_START_OPTION_TEXT = 'Display all items from the start';
export const DISPLAY_ANSWERS_TEXT = 'Display answers';
export const RANDOMIZE_ITEMS_OPTION_TEXT = 'Randomize items';
export const RANDOMIZE_ANSWERS_OPTION_TEXT = 'Randomize answers';
export const HIDE_MATCHED_CARDS_OPTION_TEXT = 'Hide matched cards';
export const NUMBER_THE_BACK_OF_THE_CARDS_OPTION_TEXT = 'Number the back of the cards';
//settings

export const INITIAL_ANSWER = {
  answerNumber: 1,
  label: '',
  imageURL: '',
  TTSText: '',
  answerText: ''
};

export const INITIAL_ANSWERS = [
  {
    answerNumber: 1,
    label: 'a.',
    isCorrect: false,
    imageURL: '',
    TTSText: '',
    answerText: ''
  },
  {
    answerNumber: 2,
    label: 'b.',
    isCorrect: false,
    imageURL: '',
    TTSText: '',
    answerText: ''
  },
  {
    answerNumber: 3,
    label: 'c.',
    isCorrect: false,
    imageURL: '',
    TTSText: '',
    answerText: ''
  }
];

export const INITIAL_GROUP = {
  groupNumber: 1,
  groupName: '', //'customActivities.group_name',
  imageURL: '',
  items: [
    {
      group: 1,
      itemNumber: 1,
      answer: {
        imageURL: '',
        TTSText: '',
        answerText: ''
      }
    }
  ]
};

export const INITIAL_QUESTION = {
  id: 1,
  questionNumber: 1,
  questionText: '',
  imageURL: '',
  TTSText: '',
  option: 'separateEachWord',
  groupNumber: 1,
  groupName: '',
  document: '',
  answers: JSON.parse(JSON.stringify(INITIAL_ANSWERS)),
  items: []
};

export const LABELS = [
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z'
];
