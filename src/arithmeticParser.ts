export function evaluateArithmeticExpr(input: string) {
  if (input === "") throw Error("Input string is empty");
  let currIdx = 0;

  function skipWhitespace() {
    while (input[currIdx] === " ") currIdx++;
  }

  function apply(op: "+" | "-" | "*" | "%" | "/", left: number, right: number) {
    switch (op) {
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "/":
        return left / right;
      case "%":
        return left % right;
    }
  }

  function evaluateExpr(): number {
    skipWhitespace();
    let value = evaluateTerm();

    while (true) {
      skipWhitespace();

      if (input[currIdx] === "+" || input[currIdx] === "-") {
        let op = input[currIdx++] as "+" | "-";
        let right = evaluateTerm();
        value = apply(op, value, right);
      } else {
        break;
      }
    }

    return value;
  }

  function evaluateTerm(): number {
    skipWhitespace();
    let value = evaluateFactor();

    while (true) {
      skipWhitespace();

      if (["*", "/", "%"].includes(input[currIdx])) {
        let op = input[currIdx++] as "*" | "/" | "%";
        let right = evaluateFactor();

        if (right === 0 && op === "/") throw new Error("Division by 0");
        value = apply(op, value, right);
      } else {
        break;
      }
    }

    return value;
  }

  function evaluateFactor(): number {
    skipWhitespace();

    if (/\d/.test(input[currIdx]) || /\-/.test(input[currIdx])) {
      let start = currIdx;

      while (
        currIdx < input.length &&
        (/\d/.test(input[currIdx]) || /\.{1}/.test(input[currIdx]))
      ) {
        currIdx++;
      }

      return Number(input.slice(start, currIdx));
    }

    if (input[currIdx] === "(") {
      currIdx++;
      let value = evaluateExpr();

      skipWhitespace();
      if (input[currIdx] !== ")") {
        throw new Error("Expected ')'");
      }

      currIdx++;
      return value;
    }

    throw new Error("Invalid factor: " + input[currIdx]);
  }

  skipWhitespace();

  const res = evaluateExpr();

  if (currIdx < input.length) {
    throw new Error(
      "Unexpected input at position " +
        currIdx +
        " '" +
        input.slice(currIdx) +
        "'",
    );
  }

  return res;
}
