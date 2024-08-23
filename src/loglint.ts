export type LogLintResult = {
  passed: boolean,
  errors?: [
    {
      matches: [
        { start: number, end: number, message: string }
      ],
      help: string,
      name: string,
    },
  ],
}
