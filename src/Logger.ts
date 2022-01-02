export class Logger {
  constructor() {}

  log(message: string) {
    const elem = document.getElementById('console')!;
    elem.innerText += `${message}\n`;
    elem.scrollTop = elem.scrollHeight;
    console.log(message);
  }
}
