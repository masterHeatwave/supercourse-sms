import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
//import { ActivityDataService } from '../../services/activity-data.service';
import { CommonModule } from '@angular/common';
import * as Constants from '../../Constants';
import { CustomActivitiesService } from '@gen-api/custom-activities/custom-activities.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface SolvedData {
  score: number;
  attempts: number;
  duration: number;
  activityType: string;
  data: MultipleChoiceQuiz[] | LetterHunt[] | WordOrder[] | MemoryMatchingPairs[] | FillInTheGaps[] | Cloze[] | MatchingPairs[] | GroupSort[];
}

interface MultipleChoiceQuiz {
  question: string;
  questionImageURL: string;
  answers: {
    answerImageURL: string;
    answerText: string;
  }[];
  correctAnswer: string;
  userAnswer: string;
}

interface LetterHunt {
  imageURL: string;
  correctAnswer: string;
  userAnswer: string;
}

interface MemoryMatchingPairs{
  imageURL_1: string;
  imageURL_2: string;
  text_1: string;
  text_2: string;
}

interface FillInTheGaps{
  question: string;
  imageURL: string;
  correctAnswers: string[];
  userAnswers: string[]
}

interface Cloze{
  question: string;
  imageURL: string;
  correctAnswers: string[];
  userAnswers: string[]
}

interface MatchingPairs{
  question: string;
  questionImageURL: string;
  correctAnswer: string;
  correctAnswerImageURL: string;
  userAnswer: string;
  userAnswerImageURL: string;
}

interface GroupSort{
  group: {
    groupName: string;
    groupImageURL: string;
    correctAnswers: string [];
    correctAnswersImageURLs: string[];
    userAnswers: string[];
    userAnswersImageURLs: string []
  }
}

interface WordOrder{
  imageURL: string;
  prompt: string;
  correctAnswer: string;
  userAnswer: string; 
}

@Component({
  selector: 'app-solved-view',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './solved-view.component.html',
  styleUrl: './solved-view.component.scss'
})
export class SolvedViewComponent {
  @Input() assignedmentId: string = '68f23c5b43b35bc342b51189';
  @Input() studentId: string = '68d659b35ef3057d286ffa01';
  @Input() customActivityId: string = '6912eafe04f6aa289b2152af';
  hasData: boolean = false;
  @Output() onActivityLoad: EventEmitter<{}> = new EventEmitter<{}>();
  solvedData: SolvedData = {
    score: 0,
    attempts: 0,
    duration: 0,
    activityType: '',
    data: []
  };

  message: string = this.translate.instant('customActivities.loading_activity');
  isLoading: boolean = true;
  hasError: boolean = false;

  constructor(private route: ActivatedRoute, private customActivityService: CustomActivitiesService, private translate: TranslateService) {
    this.message = this.translate.instant('customActivities.loading_activity');
    this.translate.onLangChange.subscribe(() => {
      this.renderActivity();
    });
  } //, private activityDataService: ActivityDataService) {}

  ngOnInit(): void {
    //this.id = this.route.snapshot.paramMap.get('id')!;
    this.fetchActivityData();
  }

  renderActivity(): void {
    console.log('this.solvedData:', this.solvedData);
    switch (this.solvedData.activityType) {
      case Constants.CLOZE_VALUE:
        this.renderCloze();
        break;
      case Constants.FILL_IN_THE_BLANKS_VALUE:
        this.renderFillInTheGaps();
        break;
      case Constants.GROUP_SORT_VALUE:
        this.renderGroupSort();
        break;
      case Constants.LETTER_HUNT_VALUE:
        this.renderLetterHunt();
        break;
      case Constants.MATCHING_PAIRS_VALUE:
        this.renderMatchingPairs();
        break;
      case Constants.MEMORY_MATCHING_PAIRS_VALUE:
        this.renderMemoryMatchingPairs();
        break;
      case Constants.MULTIPLE_CHOICE_QUIZ_VALUE:
        this.renderMultipleChoice();
        break;
      case Constants.WORD_ORDER_VALUE:
        this.renderWordOrder();
        break;
    }
  }

  renderCloze(): void {
    const div = document.createElement('div');

    // Title
    const title = document.createElement('p');
    const underline = document.createElement('u');
    underline.textContent = this.translate.instant('customActivities.text');
    title.appendChild(underline);
    div.appendChild(title);

    (this.solvedData.data as Cloze[]).forEach((question, qIndex) => {
      const line = document.createElement('div');
      line.style.marginBottom = '20px';
      line.style.lineHeight = '1.7';

      // "1. "
      const prefix = document.createElement('span');
      prefix.textContent = `${qIndex + 1}. `;
      //line.appendChild(prefix);

      // Build sentence DOM
      const sentenceNodes = this.buildSentenceDom(
        question.question,
        question.correctAnswers,
        question.userAnswers,
        true
      );
      sentenceNodes.forEach(n => line.appendChild(n));

      div.appendChild(line);

      // Optional image
      if (question.imageURL) {
        const img = document.createElement('img');
        img.src = question.imageURL;
        img.style.maxWidth = '80%';
        img.style.maxHeight = '200px';
        img.style.display = 'block';
        line.appendChild(img);
      }
    });

    this.renderInDom(div);
  }

  renderFillInTheGaps() {
    const div = document.createElement('div');

    // Title
    const title = document.createElement('p');
    const underline = document.createElement('u');
    underline.textContent = this.translate.instant('customActivities.sentences');
    title.appendChild(underline);
    div.appendChild(title);

    (this.solvedData.data as FillInTheGaps[]).forEach((question, qIndex) => {
      const line = document.createElement('div');
      line.style.marginBottom = '20px';
      line.style.lineHeight = '1.7';

      // "1. "
      const prefix = document.createElement('span');
      prefix.textContent = `${qIndex + 1}. `;
      line.appendChild(prefix);

      // Build sentence DOM
      const sentenceNodes = this.buildSentenceDom(
        question.question,
        question.correctAnswers,
        question.userAnswers
      );
      sentenceNodes.forEach(n => line.appendChild(n));

      div.appendChild(line);

      // Optional image
      if (question.imageURL) {
        const img = document.createElement('img');
        img.src = question.imageURL;
        img.style.maxWidth = '80%';
        img.style.maxHeight = '200px';
        img.style.display = 'block';
        line.appendChild(img);
      }
    });

    this.renderInDom(div);
  }

/**
 * Convert the sentence with underscores into DOM nodes
 * with highlighted spans, no innerHTML.
 */
  buildSentenceDom(
    sentence: string,
    correctAnswers: string[],
    userAnswers: string[],
    useIndex: boolean = false
  ): Node[] {
    const nodes: Node[] = [];
    let remaining = sentence;
    let answerIndex = 0;

    while (remaining.includes('_') && answerIndex < correctAnswers.length) {
      // Split at the first underscore sequence
      const match = remaining.match(/_+/);
      if (!match) break;

      const before = remaining.slice(0, match.index);
      if (before) nodes.push(document.createTextNode(before));

      const answerSpan = this.buildAnswerSpan(
        correctAnswers[answerIndex],
        userAnswers[answerIndex],
        useIndex,
        answerIndex + 1
      );
      nodes.push(answerSpan);

      remaining = remaining.slice(match.index! + match[0].length);
      answerIndex++;
    }

    // Append leftover text
    if (remaining) nodes.push(document.createTextNode(remaining));

    return nodes;
  }

  /**
   * Build the colored <span> for each gap.
   */
  buildAnswerSpan(answer: string, user: string | undefined, useIndex: boolean = false, index: number = 0): HTMLElement {
    const span = document.createElement('span');
    span.style.textDecoration = 'underline';
    span.style.padding = '2px 4px';
    span.style.whiteSpace = 'pre'; 
    span.style.outline = '0px solid black';
    span.style.borderRadius = '1px';

    const correct = user === answer;
    
    if (correct) {
      span.style.backgroundColor = '#98FF98';

      const b = document.createElement('b');
      b.textContent = answer;
      span.appendChild(b);
    } else {
      span.style.backgroundColor = '#FF9999';

      if (user) {
        const i = document.createElement('i');
        i.textContent = user + ' ';
        span.appendChild(i);
      } else {
        const i = document.createElement('i');
        i.textContent = 'no answer ';
        span.appendChild(i);
      }

      const b = document.createElement('b');
      b.textContent = answer;
      span.appendChild(b);
    }
    span.prepend(document.createTextNode(' '));
    span.prepend(document.createTextNode(' '));
    span.appendChild(document.createTextNode(' '));
    span.appendChild(document.createTextNode(' '));
    if(useIndex){
      span.prepend(document.createTextNode(index + '. '));  
    }

    return span;
  }

  renderGroupSort() {
    const allCorrectAnswers: string[] = [];
    const allCorrectAnswersImages: string[] = [];
    const allUserAnswers: string[] = [];
    const div = document.createElement('div');
    const div2 = document.createElement('div');
    div2.style.display = 'flex';
    div2.style.gap = '10px';
    const div3 = document.createElement('div');
    div3.style.display = 'flex';
    div3.style.gap = '10px';

    // Title
    const title = document.createElement('p');
    const u = document.createElement('u');
    u.textContent = this.translate.instant('customActivities.groups');
    title.appendChild(u);
    div.appendChild(title);
    // Subtitle: "User answers"
    const subtitle = document.createElement('p');
    const subtitleUnderline = document.createElement('u');
    const subtitleBold = document.createElement('b');
    subtitleBold.textContent = this.translate.instant('customActivities.user_answers');
    subtitleUnderline.appendChild(subtitleBold);
    subtitle.appendChild(subtitleUnderline);
    div.appendChild(subtitle);
    div.appendChild(div2);

    (this.solvedData.data as GroupSort[]).forEach(group => {

      // Collect correct answers
      group.group.correctAnswers.forEach(a => allCorrectAnswers.push(a));
      group.group.correctAnswersImageURLs.forEach(a => allCorrectAnswersImages.push(a));

      // Collect user answers
      group.group.userAnswers.forEach(a => allUserAnswers.push(a));

      // Each group gets its own block directly under div
      const groupBlock = document.createElement('div');
      groupBlock.style.marginBottom = '10px'; // spacing between groups
      groupBlock.style.marginTop = '10px'; // spacing between groups
      groupBlock.style.border = '2px solid black';
      groupBlock.style.display = 'flex';
      groupBlock.style.flexDirection = 'column';
      groupBlock.style.borderRadius = '5px';
      groupBlock.style.padding = '2px';
      groupBlock.style.gap = '2px';
      div2.appendChild(groupBlock);

      // Group header (image + name)
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.fontWeight = 'bold';
      //header.style.justifyContent = 'center';
      header.style.paddingLeft = '20px';
      header.style.paddingRight = '20px';
      header.style.borderBottom = '2px solid black';
      header.style.marginBottom = '10px';
      //header.style.borderRadius = '5px';

      if (group.group.groupImageURL) {
        const img = document.createElement('img');
        img.src = group.group.groupImageURL;
        img.style.maxHeight = '30px';
        header.appendChild(img);
      }

      const nameSpan = document.createElement('span');
      nameSpan.textContent = group.group.groupName;
      header.appendChild(nameSpan);

      groupBlock.appendChild(header);

      // User answers
      group.group.userAnswers.forEach((answer, index) => {
        const correct = group.group.correctAnswers.includes(answer);

        const answerBox = document.createElement('div');
        answerBox.style.display = 'flex';
        answerBox.style.alignItems = 'center';
        answerBox.style.justifyContent = 'center';
        answerBox.style.border = '1px solid black';
        answerBox.style.borderRadius = '5px';
        answerBox.style.padding = '3px';
        answerBox.style.backgroundColor = correct ? '#98FF98' : '#FF9999';

        const answerImgURL = group.group.userAnswersImageURLs[index];
        if (answerImgURL) {
          const img = document.createElement('img');
          img.src = answerImgURL;
          img.style.maxHeight = '30px';
          answerBox.appendChild(img);
        }

        const answerSpan = document.createElement('span');
        answerSpan.textContent = answer;
        answerBox.appendChild(answerSpan);

        groupBlock.appendChild(answerBox);
      });
    });

    const missingIndexes = allCorrectAnswers.map((a, i) => (!allUserAnswers.includes(a) ? i : -1)).filter(i => i !== -1);

    const missingAnswers = missingIndexes.map(i => allCorrectAnswers[i]);//allCorrectAnswers.filter(a => !allUserAnswers.includes(a));
    const missingAnswersImages = missingIndexes.map(i => allCorrectAnswersImages[i]);

    if (missingAnswers.length > 0) {
      const missingBlock = document.createElement('div');
      missingBlock.style.display = 'flex';
      missingBlock.style.alignItems = 'center';
      missingBlock.style.borderTop = '1px solid black';
      missingBlock.style.borderBottom = '1px solid black';

      const title = document.createElement('p');
      title.style.fontWeight = 'bold';
      title.textContent = this.translate.instant('customActivities.not_used');
      missingBlock.appendChild(title);

      missingAnswers.forEach((answer, i) => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.alignItems = 'center';

        const imgURL = missingAnswersImages[i];
        if (imgURL) {
          const img = document.createElement('img');
          img.src = imgURL;
          img.style.maxHeight = '30px';
          img.style.marginRight = '4px';
          div.appendChild(img);
        }
        const span = document.createElement('span');
        span.textContent = answer;
        div.appendChild(span);

        missingBlock.appendChild(div);
        if (i < missingAnswers.length - 1) {
          const comma = document.createElement('span');
          comma.textContent = ',';
          missingBlock.appendChild(comma);
        }
      });

      div.appendChild(missingBlock);
    }

    // CORRECT GROUPS
    const subtitle2 = document.createElement('p');
    const subtitleUnderline2 = document.createElement('u');
    const subtitleBold2 = document.createElement('b');
    subtitleBold2.textContent = this.translate.instant('customActivities.correct_answers');
    subtitleUnderline2.appendChild(subtitleBold2);
    subtitle2.appendChild(subtitleUnderline2);
    subtitle2.style.marginTop = '20px';
    div.appendChild(subtitle2);
    (this.solvedData.data as GroupSort[]).forEach(group => {

      // Each group gets its own block directly under div
      const groupBlock = document.createElement('div');
      groupBlock.style.marginBottom = '10px'; // spacing between groups
      groupBlock.style.marginTop = '10px'; // spacing between groups
      groupBlock.style.border = '2px solid black';
      groupBlock.style.display = 'flex';
      groupBlock.style.flexDirection = 'column';
      groupBlock.style.borderRadius = '5px';
      groupBlock.style.padding = '2px';
      groupBlock.style.gap = '2px';
      div3.appendChild(groupBlock);

      // Group header (image + name)
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.fontWeight = 'bold';
      header.style.paddingLeft = '20px';
      header.style.paddingRight = '20px';
      header.style.justifyContent = 'center';
      header.style.borderBottom = '2px solid black';
      header.style.marginBottom = '10px';
      //header.style.borderRadius = '5px';

      if (group.group.groupImageURL) {
        const img = document.createElement('img');
        img.src = group.group.groupImageURL;
        img.style.maxHeight = '30px';
        header.appendChild(img);
      }

      const nameSpan = document.createElement('span');
      nameSpan.textContent = group.group.groupName;
      header.appendChild(nameSpan);

      groupBlock.appendChild(header);

      // User answers
      group.group.correctAnswers.forEach((answer, index) => {
        const correct = group.group.correctAnswers.includes(answer);

        const answerBox = document.createElement('div');
        answerBox.style.display = 'flex';
        answerBox.style.alignItems = 'center';
        answerBox.style.justifyContent = 'center';
        answerBox.style.border = '1px solid black';
        answerBox.style.borderRadius = '5px';
        answerBox.style.padding = '3px';
        answerBox.style.backgroundColor = correct ? '#98FF98' : '#FF9999';
        //answerBox.style.marginTop = '5px';

        const answerImgURL = group.group.correctAnswersImageURLs[index];
        if (answerImgURL) {
          const img = document.createElement('img');
          img.src = answerImgURL;
          img.style.maxHeight = '30px';
          answerBox.appendChild(img);
        }

        const answerSpan = document.createElement('span');
        answerSpan.textContent = answer;
        answerBox.appendChild(answerSpan);

        groupBlock.appendChild(answerBox);

        div.appendChild(div3);
      });
    });
    // CORRECT GROUPS

    this.renderInDom(div);
  }

  renderLetterHunt() {
    // Create main container
    const container = document.createElement('div');

    // Header
    const header = document.createElement('p');
    const headerUnderline = document.createElement('u');
    headerUnderline.textContent = this.translate.instant('customActivities.words');
    header.appendChild(headerUnderline);
    header.style.marginBottom = '10px';
    container.appendChild(header);

    // Iterate over questions
    (this.solvedData.data as LetterHunt[]).forEach((question, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.style.display = 'flex';
        itemDiv.style.alignItems = 'center';
        itemDiv.style.justifyContent = 'start';
        itemDiv.style.gap = '5px';
        itemDiv.style.marginBottom = '8px';

        // Numbering
        const numberSpan = document.createElement('span');
        numberSpan.textContent = `${index + 1}. `;
        itemDiv.appendChild(numberSpan);

        // Answer display
        const answerSpan = document.createElement('span');
        answerSpan.style.padding = '3px';
        answerSpan.style.borderRadius = '5px';

        if (question.correctAnswer === question.userAnswer) {
            // Correct
            answerSpan.style.backgroundColor = '#98FF98';
            const bold = document.createElement('b');
            bold.textContent = question.correctAnswer;
            answerSpan.appendChild(bold);
        } else if (question.userAnswer !== '') {
            // Wrong
            answerSpan.style.backgroundColor = '#FF9999';

            const userAnswer = document.createElement('i');
            userAnswer.textContent = question.userAnswer + ' ';
            answerSpan.appendChild(userAnswer);

            const correctAnswer = document.createElement('b');
            correctAnswer.textContent = question.correctAnswer;
            answerSpan.appendChild(correctAnswer);
        } else {
            // Empty
            answerSpan.style.backgroundColor = '#FF9999';

            const noAnswer = document.createElement('i');
            noAnswer.textContent = 'no answer ';
            answerSpan.appendChild(noAnswer);

            const correctAnswer = document.createElement('b');
            correctAnswer.textContent = question.correctAnswer;
            answerSpan.appendChild(correctAnswer);
        }

        itemDiv.appendChild(answerSpan);

        // Optional image
        if (question.imageURL) {
            const img = document.createElement('img');
            img.src = question.imageURL;
            img.style.maxWidth = '80%';
            img.style.maxHeight = '35px';
            itemDiv.appendChild(img);
        }

        container.appendChild(itemDiv);
    });

    this.renderInDom(container);
  }

  renderMatchingPairs() {
    const div = document.createElement('div');

    // Title: "Pairs"
    const title = document.createElement('p');
    const titleUnderline = document.createElement('u');
    titleUnderline.textContent = this.translate.instant('customActivities.pairs');
    title.appendChild(titleUnderline);
    div.appendChild(title);

    // Subtitle: "User answers"
    const subtitle = document.createElement('p');
    const subtitleUnderline = document.createElement('u');
    const subtitleBold = document.createElement('b');
    subtitleBold.textContent = this.translate.instant('customActivities.user_answers');
    subtitleUnderline.appendChild(subtitleBold);
    subtitle.appendChild(subtitleUnderline);
    div.appendChild(subtitle);

    (this.solvedData.data as MatchingPairs[]).forEach(question => {
      // Block for this pair
      const block = document.createElement('p');
      block.style.marginBottom = '15px';
      block.style.display = 'flex';         // ← Add
      block.style.alignItems = 'center';

      // Optional question image
      if (question.questionImageURL) {
        const img = document.createElement('img');
        img.src = question.questionImageURL;
        img.style.maxWidth = '80%';
        img.style.maxHeight = '30px';
        //img.style.marginRight = '6px';
        block.appendChild(img);
      }

      const isCorrect = question.correctAnswer === question.userAnswer;
      const userEmpty = question.userAnswer === '';

      // Helper inline: create colored tag spans
      const makeSpan = (text: string, color: string) => {
        const span = document.createElement('span');
        span.style.border = '2px solid black';
        span.style.padding = '3px';
        span.style.backgroundColor = color;
        //span.style.marginRight = '6px';
        span.textContent = text;
        return span;
      };

      if (isCorrect) {
        // Correct answer = green
        block.appendChild(makeSpan(question.question, '#98FF98'));

        if (question.correctAnswerImageURL) {
          const img = document.createElement('img');
          img.src = question.correctAnswerImageURL;
          img.style.maxWidth = '80%';
          img.style.maxHeight = '30px';
          img.style.marginRight = '6px';
          block.appendChild(img);
        }

        block.appendChild(makeSpan(question.userAnswer, '#98FF98'));

      } else if (!userEmpty) {
        // Wrong but answered = red
        block.appendChild(makeSpan(question.question, '#FF9999'));

        if (question.userAnswerImageURL) {
          const img = document.createElement('img');
          img.src = question.userAnswerImageURL;
          img.style.maxWidth = '80%';
          img.style.maxHeight = '30px';
          //img.style.marginRight = '6px';
          block.appendChild(img);
        }

        block.appendChild(makeSpan(question.userAnswer, '#FF9999'));

      } else {
        // No answer = red
        block.appendChild(makeSpan(question.question, '#FF9999'));
      }

      div.appendChild(block);
    });

    const subtitle2 = document.createElement('p');
    const subtitleUnderline2 = document.createElement('u');
    const subtitleBold2 = document.createElement('b');
    subtitleBold2.textContent = this.translate.instant('customActivities.correct_answers');
    subtitleUnderline2.appendChild(subtitleBold2);
    subtitle2.appendChild(subtitleUnderline2);
    div.appendChild(subtitle2);

    (this.solvedData.data as MatchingPairs[]).forEach(question => {
      const block = document.createElement('p');
      block.style.marginBottom = '15px';
      block.style.display = 'flex';
      block.style.alignItems = 'center';

      // Optional question image
      if (question.questionImageURL) {
        const img = document.createElement('img');
        img.src = question.questionImageURL;
        img.style.maxWidth = '80%';
        img.style.maxHeight = '30px';
        block.appendChild(img);
      }

      // Inline helper to create green tags
      const makeTag = (text: string) => {
        const span = document.createElement('span');
        span.style.border = '2px solid black';
        span.style.padding = '3px';
        span.style.backgroundColor = '#98FF98'; // always green
        //span.style.marginLeft = '6px';
        //span.style.marginRight = '6px';
        span.textContent = text;
        return span;
      };

      // Always append question text
      block.appendChild(makeTag(question.question));

      // Optional correct answer image
      if (question.correctAnswerImageURL) {
        const img = document.createElement('img');
        img.src = question.correctAnswerImageURL;
        img.style.maxWidth = '80%';
        img.style.maxHeight = '30px';
        block.appendChild(img);
      }

      // Always append correct answer
      block.appendChild(makeTag(question.correctAnswer));

      div.appendChild(block);
    });

    this.renderInDom(div);
  }

  renderMemoryMatchingPairs() {
    const container = document.createElement('div');

    // Header
    const header = document.createElement('p');
    const underline = document.createElement('u');
    underline.textContent = this.translate.instant('customActivities.pairs');
    header.appendChild(underline);
    header.style.marginBottom = '10px';
    container.appendChild(header);

    (this.solvedData.data as MemoryMatchingPairs[]).forEach((pair, index) => {
        const pairWrapper = document.createElement('div');
        pairWrapper.style.marginBottom = '15px';

        // Horizontal row containing number and pair columns
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'flex-start';
        row.style.gap = '15px';

        // Number column
        const numberCol = document.createElement('div');
        numberCol.style.display = 'flex';
        numberCol.style.alignItems = 'flex-start';
        //numberCol.style.fontWeight = 'bold';
        numberCol.textContent = `${index + 1}.`;

        // Column 1 (image_1 + text_1)
        const col1 = document.createElement('div');
        col1.style.display = 'flex';
        col1.style.flexDirection = 'column';
        col1.style.alignItems = 'center';
        col1.style.textAlign = 'center';

        if (pair.imageURL_1) {
            const img1 = document.createElement('img');
            img1.src = pair.imageURL_1;
            img1.style.maxWidth = '80%';
            img1.style.maxHeight = '100px';
            col1.appendChild(img1);
        }

        if (pair.text_1) {
            const text1 = document.createElement('span');
            text1.textContent = pair.text_1;
            text1.style.marginTop = '4px';
            col1.appendChild(text1);
        }

        // Column 2 (image_2 + text_2)
        const col2 = document.createElement('div');
        col2.style.display = 'flex';
        col2.style.flexDirection = 'column';
        col2.style.alignItems = 'center';
        col2.style.textAlign = 'center';

        if (pair.imageURL_2) {
            const img2 = document.createElement('img');
            img2.src = pair.imageURL_2;
            img2.style.maxWidth = '80%';
            img2.style.maxHeight = '100px';
            col2.appendChild(img2);
        }

        if (pair.text_2) {
            const text2 = document.createElement('span');
            text2.textContent = pair.text_2;
            text2.style.marginTop = '4px';
            col2.appendChild(text2);
        }

        // Add columns to row
        row.appendChild(numberCol);
        row.appendChild(col1);
        row.appendChild(col2);

        // Add row to wrapper
        pairWrapper.appendChild(row);

        // Add wrapper to container
        container.appendChild(pairWrapper);
    });

    this.renderInDom(container);
  }

  renderMultipleChoice() {
    const container = document.createElement('div');

    const header = document.createElement('p');
    const headerUnderline = document.createElement('u');
    headerUnderline.textContent = this.translate.instant('customActivities.questions');
    header.appendChild(headerUnderline);
    header.style.marginBottom = '10px';
    container.appendChild(header);

    (this.solvedData.data as MultipleChoiceQuiz[]).forEach((question, qIndex) => {
        const questionDiv = document.createElement('div');
        questionDiv.style.marginBottom = '16px';

        const questionRow = document.createElement('div');
        questionRow.style.display = 'flex';
        questionRow.style.alignItems = 'center';
        questionRow.style.justifyContent = 'flex-start';
        questionRow.style.gap = '10px';

        const questionText = document.createElement('span');
        questionText.textContent = `${qIndex + 1}. ${question.question}`;
        questionRow.appendChild(questionText);

        if (question.questionImageURL) {
            const qImg = document.createElement('img');
            qImg.src = question.questionImageURL;
            qImg.style.maxWidth = '80px';
            qImg.style.maxHeight = '60px';
            qImg.style.objectFit = 'contain';
            questionRow.appendChild(qImg);
        }

        questionDiv.appendChild(questionRow);

        const answersContainer = document.createElement('div');
        answersContainer.style.display = 'flex';
        answersContainer.style.flexWrap = 'wrap';
        answersContainer.style.gap = '20px';
        answersContainer.style.marginTop = '10px';
        //answersContainer.style.justifyContent = 'center';

        question.answers.forEach((answer, aIndex) => {
            const answerBlock = document.createElement('div');
            answerBlock.style.display = 'flex';
            answerBlock.style.flexDirection = 'column';
            answerBlock.style.alignItems = 'center';
            answerBlock.style.maxWidth = '150px';
            answerBlock.style.textAlign = 'center';

            const answerText = document.createElement('span');
            const letter = String.fromCharCode(97 + aIndex);
            answerText.textContent = `${letter}. ${answer.answerText}`;
            answerText.style.padding = '2px 5px';
            answerText.style.borderRadius = '5px';
            answerText.style.display = 'inline-block';
            answerText.style.boxSizing = 'border-box';

            if (answer.answerText === question.correctAnswer && question.userAnswer !== question.correctAnswer && question.userAnswer !== '') {
                answerText.style.outline = '1px solid grey';
                answerText.style.backgroundColor = '#98FF98'; // only correct
            } else if (answer.answerText === question.userAnswer && question.userAnswer !== question.correctAnswer && question.userAnswer !== '') {
                answerText.style.backgroundColor = '#FF9999'; // wrong
                answerText.style.outline = '3px solid black';
            } else if (answer.answerText === question.correctAnswer && question.correctAnswer === question.userAnswer) {
                answerText.style.backgroundColor = '#98FF98'; // correct chosen
                answerText.style.outline = '3px solid black';
            } else if (answer.answerText === question.correctAnswer && question.userAnswer === '') {
                answerText.style.backgroundColor = '#98FF98'; // correct but unanswered
                answerText.style.border = '1px solid grey';
            }

            answerBlock.appendChild(answerText);

            if (answer.answerImageURL) {
                const answerImg = document.createElement('img');
                answerImg.src = answer.answerImageURL;
                answerImg.style.maxWidth = '80px';
                answerImg.style.maxHeight = '60px';
                answerImg.style.marginTop = '4px';
                answerImg.style.objectFit = 'contain';
                answerBlock.appendChild(answerImg);
            }

            answersContainer.appendChild(answerBlock);
        });

        questionDiv.appendChild(answersContainer);
        container.appendChild(questionDiv);
    });

    this.renderInDom(container);
  }

  renderWordOrder() {
    const wrapper = document.createElement('div');

    const title = document.createElement('div');
    title.innerHTML = `<u>${this.translate.instant('customActivities.text')}</u>`;
    wrapper.appendChild(title);

    (this.solvedData.data as WordOrder[]).forEach((question, index) => {

      const row = document.createElement('div');
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "5px";

      row.innerHTML += (index + 1) + ". ";

      const span = document.createElement('span');
      span.style.display = "inline-block";
      span.style.padding = "2px 2px";
      span.style.border = "3px solid black";
      span.style.borderRadius = "5px";

      if (question.correctAnswer !== question.userAnswer && question.userAnswer !== "") {
        span.style.backgroundColor = "#FF9999";
        span.innerHTML = `<i>${question.userAnswer}</i><br/><b>${question.correctAnswer}</b>`;
      } else if (question.correctAnswer === question.userAnswer) {
        span.style.backgroundColor = "#98FF98";
        span.innerHTML = `<b>${question.correctAnswer}</b>`;
      } else {
        span.style.backgroundColor = "#FF9999";
        span.innerHTML = `<i>${question.prompt}</i><br/><b>${question.correctAnswer}</b>`;
      }

      row.appendChild(span);

      if (question.imageURL) {
        const img = document.createElement("img");
        img.src = question.imageURL;
        img.style.maxWidth = "80%";
        img.style.maxHeight = "35px";
        row.appendChild(img);
      }

      wrapper.appendChild(row);
    });

    this.renderInDom(wrapper);
  }

  renderInDom(element: HTMLElement): void {
    const container = document.getElementById('activity-container');
    if (container) {
      container.innerHTML = '';
      container.appendChild(element);
    }
  }

  fetchActivityData(): void {
    this.customActivityService.getCustomActivitiesTaskAnswersAssignmentIdStudentIdCustomActivityId(this.assignedmentId, this.studentId, this.customActivityId).subscribe({
      next: (response: any) => {
        if (response.data) {
          this.solvedData = response.data.answers;
          this.hasData = true;
          this.isLoading = false;
          this.onActivityLoad.emit(response.data);

          setTimeout(() => this.renderActivity());
        } else {
          this.isLoading = false;
          this.hasError = true;
          this.message = this.translate.instant('customActivities.error_loading_activity'); //'There was an error loading the activity. Please try again.';
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.hasError = true;
        this.message = this.translate.instant('customActivities.error_loading_activity'); //'There was an error loading the activity. Please try again.';
        console.error('Error fetching item:', err);
      }
    });
    /*this.activityDataService.getActivityDataById(this.id).subscribe({
      next: (data: any) => {
        this.activityData = data.data;
        this.hasData = true;
        this.isLoading = false;
        this.onActivityLoad.emit(data.data);
      },
      error: (err: any) => {
        this.message = 'There was an error loading the activity. Please try again.';
        console.error('Error fetching item:', err);
      }
    });*/
  }
}
