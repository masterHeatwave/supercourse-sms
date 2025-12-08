import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ChatbotService } from '@gen-api/chatbot/chatbot.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-chat-bot',
  standalone: true,
  imports: [DialogModule, InputTextModule, ButtonModule, FormsModule, CommonModule, TranslateModule],
  templateUrl: './chat-bot.component.html',
  styleUrl: './chat-bot.component.scss'
})
export class ChatBotComponent {
  @ViewChild('chatButton', { static: false }) chatButton!: ElementRef;
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
  userMessage: string = '';
  botMessages: string[] = [];
  chatHistory: { bot: string[] }[] = [];
  messages: string[] = [];
  showChat: boolean = false;
  keyCounter: number = this.messages.length - 1;
  isBotTyping: boolean = false;
  
  chatbotService = inject(ChatbotService);

  constructor(private cdr: ChangeDetectorRef) {}

  /*ngAfterViewChecked() {
    this.scrollToBottom();
  }*/

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  makeLinksClickable(text: string): string {
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;

    return text.replace(urlRegex, (url) => {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
  }

  sendMessage() {
    if (this.userMessage.trim() && !this.isBotTyping) {
      this.isBotTyping = true;
      this.messages.push(this.userMessage);
      this.chatHistory.push({ bot: [] });
      const userMsg = this.userMessage;
      //this.userMessage = '';
      this.cdr.detectChanges();
      setTimeout(() => {
        this.scrollToBottom();
        this.chatbotService.postChatbot({ message: userMsg }).subscribe({
          next: (response: any) => {
            //console.log('response', response);
            const botReplies: string = response.data.reply;
            this.chatHistory.pop();

            //response.results.forEach((result: any) => {
            //const formattedResult = `Title: ${result.title}<br>Description: ${result.description}`;
            //botReplies.push(formattedResult);
            //});

            this.chatHistory.push({ bot: [botReplies] });
            this.isBotTyping = false;
            this.cdr.detectChanges();
            this.scrollToBottom();
          },
          error: (err: any) => {
            this.chatHistory.pop();
            this.chatHistory.push({ bot: ['Something went wrong. Please try again.'] });
            this.isBotTyping = false;
            this.cdr.detectChanges();
            this.scrollToBottom();
          }
        });
        this.userMessage = '';
        this.keyCounter = this.messages.length - 1;
      }, 0);
    }
  }

  showChatClick() {
    this.showChat = !this.showChat;
    this.scrollToBottom();
  }

  choosePreviousMessage(event: KeyboardEvent) {
    //this.userMessage = this.messages[this.messages.length - 1];
    if (event.key === 'ArrowUp') {
      this.userMessage = this.messages[this.keyCounter];
      if (this.keyCounter > -1) {
        this.keyCounter--;
      }
    }
    if (event.key === 'ArrowDown') {
      this.userMessage = this.messages[this.keyCounter];
      if (this.keyCounter < this.messages.length - 1) {
        this.keyCounter++;
      }
    }
  }
}
