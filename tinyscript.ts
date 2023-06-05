class TSError extends Error {
    constructor(message: string) {
        super(message);
    }
}

enum TokenType {
    Id,

    // keywords
    Let,
    Print,
    If, Else,
    While,

    //literals
    IntLiteral,

    // punctuations
    LParen, RParen, // ()
    Semi, // ;
    RightArrow, // =>

    // operators
    Assign,
    EQ, NE, LT, GT, LE, GE,
    Plus, Minus, Mul, Div,
}

class Token {
    type: TokenType;
    value?: string;

    constructor(type: TokenType, value?: string) {
        this.type = type;
        this.value = value;
    }

    static intLiteral(value: string): Token {
        return new Token(TokenType.IntLiteral, value);
    }
    
    static id(value: string): Token {
        return new Token(TokenType.Id, value);
    }

    static symbol(type: TokenType): Token {
        return new Token(type);
    }
}

const keywords = {
    "let": TokenType.Let,
    "print": TokenType.Print
};

const tokenize = (input: string) => {
    let tokens = [];
    let index = 0;

    const isWhitespace = c => /\s/.test(c);
    const isNumber = c => /[0-9]/.test(c);
    const isLetter = c => /[a-z]/i.test(c);

    while (index < input.length) {
        let char = input[index];
        if (isWhitespace(char)) {
            index++;
            continue;
        }
        
        if (isNumber(char)) {
            let value = "";
            while (isNumber(char)) {
                value += char;
                index++;
                char = input[index];
            }
            
            tokens.push(Token.intLiteral(value));
            continue;
        }

        if (isLetter(char)) {
            let value = "";
            while (isLetter(char)) {
                value += char;
                index++;
                char = input[index];
            }
            
            const kwType = keywords[value];
            if (kwType != null) {
                tokens.push(new Token(kwType));
            } else {
                tokens.push(Token.id(value));
            }

            continue;
        }

        switch (char) {
        case '(':
            tokens.push(new Token(TokenType.LParen));
            index++;
            continue;
        case ')':
            tokens.push(new Token(TokenType.RParen));
            index++;
            continue;
        case '+':
            tokens.push(new Token(TokenType.Plus));
            index++;
            continue;
        case '-':
            tokens.push(new Token(TokenType.Minus));
            index++;
            continue;
        case '*':
            tokens.push(new Token(TokenType.Mul));
            index++;
            continue;
        case '/':
            tokens.push(new Token(TokenType.Div));
            index++;
            continue;
        case ';':
            tokens.push(new Token(TokenType.Semi));
            index++;
            continue;
        default:
            throw new TSError(`Unknown char '${char}'`);
        }
    }

    return tokens;
};

enum NodeKind {
    Program,
    LetStatement,
    PrintStatement,
    BinaryExpression,
    IntLiteral
}

interface ASTNode {
    kind: NodeKind;
}

interface Statement extends ASTNode {}
interface Expression extends ASTNode {}
interface Literal extends Expression {}

class Program implements ASTNode {
    kind: NodeKind.Program;
    body: Statement[];

    constructor(body: Statement[]) {
        this.kind = NodeKind.Program;
        this.body = body;
    }
}

class LetStatment implements Statement {
    kind: NodeKind.LetStatement;
    id: string;
    value: Expression;

    constructor(id: string, value: Expression) {
        this.kind = NodeKind.LetStatement;
        this.id = id;
        this.value = value;
    }
}

class PrintStatement implements Statement {
    kind: NodeKind.PrintStatement;
    value: Expression;

    constructor(value: Expression) {
        this.kind = NodeKind.PrintStatement;
        this.value = value;
    }
}

class BinaryExpression implements Expression {
    kind: NodeKind.BinaryExpression;
    left: Expression;
    operator: string;
    right: Expression;

    constructor(left: Expression, operator: string, right: Expression) {
        this.kind = NodeKind.BinaryExpression;
        this.left = left;
        this.operator = operator;
        this.right = right;
    }
}

class IntLiteral implements Literal {
    kind: NodeKind.IntLiteral;
    value: number;

    constructor(value: number) {
        this.kind = NodeKind.IntLiteral;
        this.value = value;
    }
}

const operators = {
    [TokenType.Plus]: "+",
    [TokenType.Minus]: "-",
    [TokenType.Mul]: "*",
    [TokenType.Div]: "/"
};

const parse = tokens => {
    let index = 0;

    const peek = () => tokens[index];
    const forward = () => { ++index; };
    const match = (type: TokenType) => {
        const token = peek();
        if (token.type == type) {
            forward();
            return token;
        }

        throw new TSError(`Expected token: ${type}, actual: ${token.type}`);
    };

    const parseProgram = () => {
        let statements = [];
        while (index < tokens.length) {
            statements.push(parseStatement());
        }

        return new Program(statements);
    };

    const parseStatement = () => {
        const token = peek();
        switch (token.type) {
        case TokenType.Let:
            return parseLetStatement();
        case TokenType.Print:
            return parsePrintStatement();
        default:
            throw new TSError(`Unknown statement: ${token.type}`);
        }
    };

    const parseLetStatement = () => {
        match(TokenType.Let);
        const id = match(TokenType.Id);
        match(TokenType.Assign);
        const expr = parseExpression();
        match(TokenType.Semi);
        return new LetStatment(id, expr);
    };

    const parsePrintStatement = () => {
        match(TokenType.Print);
        const expr = parseExpression();
        match(TokenType.Semi);
        return new PrintStatement(expr);
    };

    const parseExpression = () => {
        return parseAdditiveExpression();
    };

    const parseAdditiveExpression = () => {
        let expr = parseMultiplicativeExpression();
        while (true) {
            const type = peek().type;
            if (type == TokenType.Plus || type == TokenType.Minus) {
                forward();
                const operator = operators[type];
                const right = parseMultiplicativeExpression();
                expr = new BinaryExpression(expr, operator, right);
                continue;
            }

            break;
        }

        return expr;
    };

    const parseMultiplicativeExpression = () => {
        let expr = parsePrimaryExpression();
        while (true) {
            const type = peek().type;
            if (type == TokenType.Mul || type == TokenType.Div) {
                forward();
                const right = parsePrimaryExpression();
                const operator = operators[type];
                expr = new BinaryExpression(expr, operator, right);
                continue;
            }

            break;
        }

        return expr;
    };

    const parsePrimaryExpression = () => {
        const token = peek();
        const type = token.type;
        if (type == TokenType.IntLiteral) {
            forward();
            const value = parseInt(token.value);
            return new IntLiteral(value);
        }

        if (type == TokenType.LParen) {
            forward();
            const expr = parseExpression();
            match(TokenType.RParen);
            return expr;
        }

        throw new TSError(`Unknown token: ${type}`);
    };

    return parseProgram();
};

const execute = (program: Program) => {
    const exec = (node: ASTNode) => {
        switch (node.kind) {
            case NodeKind.Program: 
                return executeProgram(node as Program);    
            case NodeKind.PrintStatement:
                return executePrintStatement(node as PrintStatement);   
            case NodeKind.BinaryExpression:
                return executeBinaryExpression(node as BinaryExpression);   
            case NodeKind.IntLiteral:
                return executeIntLiteral(node as IntLiteral);
            default:
                throw new TSError(`Unknown kind: ${node.kind}`);
        }
    };

    const executeProgram = (node: Program) => {
        node.body.forEach(stmt => exec(stmt));
    };

    const executePrintStatement = (node: PrintStatement) => {
        const retVal = exec(node.value);
        console.log(retVal);
    };

    const executeBinaryExpression = (node: BinaryExpression) => {
        const left = exec(node.left);
        const right = exec(node.right);
        switch (node.operator) {
            case "+":
                return left + right;
            case "-":
                return left - right;
            case "*":
                return left * right;
            case "/":
                return left / right;
            default:
                throw new Error();
        }
    };

    const executeIntLiteral = (node: IntLiteral) => node.value;

    exec(program);
};

const code = `print 1 + 2 * (3 + 4);`
console.log(`Code:\n${code}\n`);

const tokens = tokenize(code);
console.log("Tokens:\n", tokens, "\n");

const ast = parse(tokens);
console.log("AST:\n", ast, "\n");

console.log("Execute:");
execute(ast);
