export class Logger {
  constructor(readonly element: HTMLElement) {}

  log(message: string) {
    this.element.innerText += `${message}\n`;
    this.element.scrollTop = this.element.scrollHeight;
    console.log(message);
  }
}
