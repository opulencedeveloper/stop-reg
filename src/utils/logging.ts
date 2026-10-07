export default class Logging {
  private static colors = {
    blue: "\x1b[34m",
    blueBright: "\x1b[94m",
    yellow: "\x1b[33m",
    yellowBright: "\x1b[93m",
    red: "\x1b[31m",
    redBright: "\x1b[91m",
    reset: "\x1b[0m",
  };

  public static log = (args: any) => this.info(args);

  public static info = (args: any) => {
    const timestamp = `[${new Date().toLocaleString()}][INFO]`;
    console.log(
      `${this.colors.blue}${timestamp}${this.colors.reset}`,
      typeof args === "string" ? `${this.colors.blueBright}${args}${this.colors.reset}` : args
    );
  };

  public static warn = (args: any) => {
    const timestamp = `[${new Date().toLocaleString()}][WARN]`;
    console.log(
      `${this.colors.yellow}${timestamp}${this.colors.reset}`,
      typeof args === "string" ? `${this.colors.yellowBright}${args}${this.colors.reset}` : args
    );
  };

  public static error = (args: any) => {
    const timestamp = `[${new Date().toLocaleString()}][ERROR]`;
    console.log(
      `${this.colors.red}${timestamp}${this.colors.reset}`,
      typeof args === "string" ? `${this.colors.redBright}${args}${this.colors.reset}` : args
    );
  };
}
