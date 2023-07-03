class TSError extends Error {
    constructor(message: string) {
        super(message);
    }
}

class TSFuncRetError extends Error {
    value: any;

    constructor(value) {
        super(null);
        this.value = value;
    }
}

enum TokenType {
    Id,

    // keywords
    And, Or, Not,
    Def,
    Let,
    Print,
    If, Else,
    While,
    Fn, Return, Call,

    //literals
    IntLiteral,

    // punctuations
    LParen, RParen, // ()
    LCurly, RCurly, // {}
    Semi, // ;
    RightArrow, // =>
    Comma, // ,

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
    "and": TokenType.And,
    "or": TokenType.Or,
    "not": TokenType.Not,
    "def": TokenType.Def,
    "let": TokenType.Let,
    "print": TokenType.Print,
    "if": TokenType.If,
    "else": TokenType.Else,
    "while": TokenType.While,
    "fn": TokenType.Fn,
    "return": TokenType.Return,
    "call": TokenType.Call
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
            index++;
            tokens.push(new Token(TokenType.LParen));
            continue;
        case ')':
            index++;
            tokens.push(new Token(TokenType.RParen));
            continue;
        case '{':
            index++;
            tokens.push(new Token(TokenType.LCurly));
            continue;
        case '}':
            index++;
            tokens.push(new Token(TokenType.RCurly));
            continue;
        case '+':
            tokens.push(new Token(TokenType.Plus));
            index++;
            continue;
        case '-':
            index++;
            tokens.push(new Token(TokenType.Minus));
            continue;
        case '*':
            index++;
            tokens.push(new Token(TokenType.Mul));
            continue;
        case '/':
            index++;
            tokens.push(new Token(TokenType.Div));
            continue;
        case ';':
            index++;
            tokens.push(new Token(TokenType.Semi));
            continue;
        case ',':
            index++;
            tokens.push(new Token(TokenType.Comma));
            continue;
        case '>':
            index++;
            char = input[index];
            if (char == '=') {
                index++;
                tokens.push(new Token(TokenType.GE));
            } else {
                tokens.push(new Token(TokenType.GT));
            }
            continue;
        case '<':
            index++;
            char = input[index];
            if (char == '>') {
                index++;
                tokens.push(new Token(TokenType.NE));
            } else if (char == '=') {
                index++;
                tokens.push(new Token(TokenType.LE));
            } else {
                tokens.push(new Token(TokenType.LT));
            }
            continue;
        case '=':
            index++;
            char = input[index];
            if (char == '=') {
                index++;
                tokens.push(new Token(TokenType.EQ));
            } else if (char == '>') {
                index++;
                tokens.push(new Token(TokenType.RightArrow));
            } else {
                tokens.push(new Token(TokenType.Assign));
            }
            continue;
        default:
            throw new TSError(`Unknown char '${char}'`);
        }
    }

    return tokens;
};

enum NodeKind {
    Program,
    DefStatement,
    LetStatement,
    PrintStatement,
    BlockStatement,
    IfStatement,
    WhileStatement,
    CallStatement,
    ReturnStatement,
    BinaryExpression,
    FuncCallExpression,
    NameExpression,
    IntLiteral,
    FnLiteral
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

class DefStatement implements Statement {
    kind: NodeKind.DefStatement;
    id: string;
    value: Expression;

    constructor(id: string, value: Expression) {
        this.kind = NodeKind.DefStatement;
        this.id = id;
        this.value = value;
    }
}

class LetStatement implements Statement {
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

class BlockStatement implements Statement {
    kind: NodeKind.BlockStatement;
    body: Statement[];

    constructor(body: Statement[]) {
        this.kind = NodeKind.BlockStatement;
        this.body = body;
    }
}

class IfStatement implements Statement {
    kind: NodeKind.IfStatement;
    condition: Expression;
    body: Statement;
    elseBody: Statement;

    constructor(condition: Expression, body: Statement, elseBody: Statement) {
        this.kind = NodeKind.IfStatement;
        this.condition = condition;
        this.body = body;
        this.elseBody = elseBody;
    }
}

class WhileStatement implements Statement {
    kind: NodeKind.WhileStatement;
    condition: Expression;
    body: Statement;

    constructor(condition: Expression, body: Statement) {
        this.kind = NodeKind.WhileStatement;
        this.condition = condition;
        this.body = body;
    }
}

class CallStatement implements Statement {
    kind: NodeKind.CallStatement;
    expr: Expression;

    constructor(expr: Expression) {
        this.kind = NodeKind.CallStatement;
        this.expr = expr;
    }
}

class ReturnStatement implements Statement {
    kind: NodeKind.ReturnStatement;
    expr: Expression;

    constructor(expr: Expression) {
        this.kind = NodeKind.ReturnStatement;
        this.expr = expr;
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

class FuncCallExpression implements Expression {
    kind: NodeKind.FuncCallExpression;
    func: Expression;
    args: Expression[];

    constructor(func: Expression, args: Expression[]) {
        this.kind = NodeKind.FuncCallExpression;
        this.func = func;
        this.args = args;
    }
}

class NameExpression implements Expression {
    kind: NodeKind.NameExpression;
    name: string;

    constructor(name: string) {
        this.kind = NodeKind.NameExpression;
        this.name = name;
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

class FnLiteral implements Literal {
    kind: NodeKind.FnLiteral;
    args: string[]
    body: BlockStatement;

    constructor(args: string[], body: BlockStatement) {
        this.kind = NodeKind.FnLiteral;
        this.args = args;
        this.body = body;
    }
}

const operators = {
    [TokenType.Plus]: "+",
    [TokenType.Minus]: "-",
    [TokenType.Mul]: "*",
    [TokenType.Div]: "/",
    [TokenType.EQ]: "==",
    [TokenType.NE]: "<>",
    [TokenType.GE]: ">=",
    [TokenType.LE]: "<=",
    [TokenType.GT]: ">",
    [TokenType.LT]: "<"
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
        case TokenType.Def:
            return parseDefStatement();
        case TokenType.Let:
            return parseLetStatement();
        case TokenType.Print:
            return parsePrintStatement();
        case TokenType.LCurly:
            return parseBlockStatement();
        case TokenType.If:
            return parseIfStatement();
        case TokenType.While:
            return parseWhileStatement();
        case TokenType.Call:
            return parseCallStatement();
        case TokenType.Return:
            return parseReturnStatement();
        default:
            throw new TSError(`Unknown statement: ${token.type}`);
        }
    };

    const parseDefStatement = () => {
        match(TokenType.Def);
        const id = match(TokenType.Id);
        match(TokenType.Assign);
        const expr = parseExpression();
        match(TokenType.Semi);
        return new DefStatement(id.value, expr);
    };

    const parseLetStatement = () => {
        match(TokenType.Let);
        const id = match(TokenType.Id);
        match(TokenType.Assign);
        const expr = parseExpression();
        match(TokenType.Semi);
        return new LetStatement(id.value, expr);
    };

    const parsePrintStatement = () => {
        match(TokenType.Print);
        const expr = parseExpression();
        match(TokenType.Semi);
        return new PrintStatement(expr);
    };

    const parseBlockStatement = () => {
        match(TokenType.LCurly);
        let statements = [];
        while (true) {
            const type = peek().type;
            if (type == TokenType.RCurly) {
                forward();
                break;
            }

            statements.push(parseStatement());
        }

        return new BlockStatement(statements);
    };

    const parseIfStatement = () => {
        match(TokenType.If);
        match(TokenType.LParen);
        const condition = parseExpression();
        match(TokenType.RParen);
        const body = parseStatement();
        let elseBody = null;
        const type = peek().type;
        if (type == TokenType.Else) {
            forward();
            elseBody = parseStatement();
        }

        return new IfStatement(condition, body, elseBody);
    };

    const parseWhileStatement = () => {
        match(TokenType.While);
        match(TokenType.LParen);
        const condition = parseExpression();
        match(TokenType.RParen);
        const body = parseStatement();
        return new WhileStatement(condition, body); 
    };

    const parseCallStatement = () => {
        match(TokenType.Call);
        const expr = parseExpression();
        match(TokenType.Semi);
        return new CallStatement(expr);
    };

    const parseReturnStatement = () => {
        match(TokenType.Return);
        const expr = parseExpression();
        match(TokenType.Semi);
        return new ReturnStatement(expr);
    };

    const parseExpression = () => {
        return parseRelationalExpression();
    };

    const parseRelationalExpression = () => {
        let expr = parseAdditiveExpression();
        while (true) {
            const type = peek().type;
            if (type == TokenType.EQ || type == TokenType.NE
                || type == TokenType.GE || type == TokenType.LE
                || type == TokenType.GT || type == TokenType.LT) {
                forward();
                const operator = operators[type];
                const right = parseAdditiveExpression();
                expr = new BinaryExpression(expr, operator, right);
                continue;
            }

            break;
        }

        return expr;
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
        let expr = parsePostfixExpression();
        while (true) {
            const type = peek().type;
            if (type == TokenType.Mul || type == TokenType.Div) {
                forward();
                const right = parsePostfixExpression();
                const operator = operators[type];
                expr = new BinaryExpression(expr, operator, right);
                continue;
            }

            break;
        }

        return expr;
    };

    const parsePostfixExpression = () => {
        let expr = parsePrimaryExpression();
        if (peek().type == TokenType.LParen) {
            forward();
            const args = parseArgumentList();
            expr = new FuncCallExpression(expr, args);
            match(TokenType.RParen);
        }
        return expr;
    };

    const parseArgumentList = () => {
        let args = [];
        if (peek().type == TokenType.RParen) {
            return args;
        }

        args.push(parseExpression());
        while (peek().type == TokenType.Comma) {
            forward();
            args.push(parseExpression());
        }

        return args;
    };

    const parsePrimaryExpression = () => {
        const token = peek();
        const type = token.type;
        if (type == TokenType.IntLiteral) {
            forward();
            const value = parseInt(token.value);
            return new IntLiteral(value);
        }

        if (type == TokenType.Fn) {
            return parseFnLiteral();
        }

        if (type == TokenType.Id) {
            forward();
            return new NameExpression(token.value);
        }

        if (type == TokenType.LParen) {
            forward();
            const expr = parseExpression();
            match(TokenType.RParen);
            return expr;
        }

        throw new TSError(`Unknown token: ${type}`);
    };

    const parseFnLiteral = () => {
        match(TokenType.Fn);
        match(TokenType.LParen);
        let args = [];
        if (peek().type != TokenType.RParen) {
            args.push(match(TokenType.Id).value);
            while (true) {
                if (peek().type == TokenType.Comma) {
                    forward();
                    args.push(match(TokenType.Id).value);
                    continue;
                }
                
                break;
            }
        }
        
        match(TokenType.RParen);
        match(TokenType.RightArrow);
        const body = parseBlockStatement();
        return new FnLiteral(args, body);
    };

    return parseProgram();
};

class Scope {
    parent: Scope;
    objects: { [key: string]: any };

    static global(): Scope {
        return new Scope(null);
    }

    create(): Scope {
        return new Scope(this);
    }

    constructor(parent: Scope) {
        this.parent = parent;
        this.objects = {};
    }

    define(name: string, value: any) {
        if (this.objects[name] != undefined) {
            throw new TSError(`'${name}' already defined in current scope.`);
        }

        this.objects[name] = value;
    }

    set(name: string, value: any) {
        const scope = this.lookupScope(name);
        if (scope == null) {
            throw new TSError(`'${name}' undefined.`);
        }

        scope.objects[name] = value;
    }

    get(name: string): any {
        const scope = this.lookupScope(name);
        if (scope == null) {
            throw new TSError(`'${name}' undefined.`);
        }

        return scope.objects[name];
    }

    lookupScope(name: string): Scope {
        let scope: Scope = this;
        do {
            if (scope.objects[name] != undefined) {
                return scope;
            }

            scope = scope.parent;
        } while (scope != null);
        return null;
    }
}

const execute = (program: Program) => {
    const exec = (node: ASTNode, scope: Scope) => {
        switch (node.kind) {
            case NodeKind.Program: 
                return executeProgram(node as Program, scope);
            case NodeKind.BlockStatement:
                return executeBlockStatement(node as BlockStatement, scope);
            case NodeKind.PrintStatement:
                return executePrintStatement(node as PrintStatement, scope);
            case NodeKind.DefStatement:
                return executeDefStatement(node as DefStatement, scope);
            case NodeKind.LetStatement:
                return executeLetStatement(node as LetStatement, scope);
            case NodeKind.IfStatement:
                return executeIfStatement(node as IfStatement, scope);
            case NodeKind.WhileStatement:
                return executeWhileStatement(node as WhileStatement, scope);
            case NodeKind.CallStatement:
                return executeCallStatement(node as CallStatement, scope);
            case NodeKind.ReturnStatement:
                return executeReturnStatement(node as ReturnStatement, scope);
            case NodeKind.BinaryExpression:
                return executeBinaryExpression(node as BinaryExpression, scope);
            case NodeKind.FuncCallExpression:
                return executeFuncCallExpression(node as FuncCallExpression, scope);
            case NodeKind.NameExpression:
                return executeNameExpression(node as NameExpression, scope);
            case NodeKind.IntLiteral:
                return executeIntLiteral(node as IntLiteral);
            case NodeKind.FnLiteral:
                return executeFnLiteral(node as FnLiteral);
            default:
                throw new TSError(`Unknown kind: ${node.kind}`);
        }
    };

    const executeProgram = (node: Program, scope: Scope) => {
        node.body.forEach(stmt => exec(stmt, scope));
    };

    const executeBlockStatement = (node: BlockStatement, scope: Scope) => {
        const blockScope = scope.create();
        node.body.forEach(stmt => exec(stmt, blockScope));
    };

    const executePrintStatement = (node: PrintStatement, scope: Scope) => {
        const retVal = exec(node.value, scope);
        console.log(retVal);
    };

    const executeDefStatement = (node: DefStatement, scope: Scope) => {
        scope.define(node.id, exec(node.value, scope));
    };

    const executeLetStatement = (node: LetStatement, scope: Scope) => {
        scope.set(node.id, exec(node.value, scope));
    };

    const executeIfStatement = (node: IfStatement, scope: Scope) => {
        if (exec(node.condition, scope)) {
            exec(node.body, scope);
        } else if (node.elseBody != null) {
            exec(node.elseBody, scope);
        }
    };

    const executeWhileStatement = (node: WhileStatement, scope: Scope) => {
        while (exec(node.condition, scope)) {
            exec(node.body, scope);
        }
    };

    const executeCallStatement = (node: CallStatement, scope: Scope) => {
        exec(node.expr, scope);
    };

    const executeReturnStatement = (node: ReturnStatement, scope: Scope) => {
        const retVal = exec(node.expr, scope);
        throw new TSFuncRetError(retVal);
    };

    const executeBinaryExpression = (node: BinaryExpression, scope: Scope) => {
        const left = exec(node.left, scope);
        const right = exec(node.right, scope);
        switch (node.operator) {
            case "+":
                return left + right;
            case "-":
                return left - right;
            case "*":
                return left * right;
            case "/":
                return left / right;
            case "==":
                return left == right;
            case "<>":
                return left != right;
            case ">=":
                return left >= right;
            case "<=":
                return left <= right;
            case ">":
                return left > right;
            case "<":
                return left < right;
            default:
                throw new Error();
        }
    };

    const executeFuncCallExpression = (node: FuncCallExpression, scope: Scope) => {
        const func = exec(node.func, scope) as FnLiteral;
        const args = func.args;
        const argVals = node.args.map(arg => exec(arg, scope));
        const funcScope = scope.create();
        for (let i = 0; i < args.length; i++) {
            funcScope.define(args[i], argVals[i]);
        }

        try {
            exec(func.body, funcScope);
        } catch (err) {
            // TSFuncRetError
            if (err.value != undefined) {
                return err.value;
            }

            throw err;
        }
    };

    const executeNameExpression = (node: NameExpression, scope: Scope) => scope.get(node.name);

    const executeIntLiteral = (node: IntLiteral) => node.value;

    const executeFnLiteral = (node: FnLiteral) => node;

    exec(program, Scope.global());
};

const code = `
def sum = 0;
def i = 1;
while (i <= 10) {
    let sum = sum + i;
    let i = i + 1;
}
print sum;

def p = fn (n) => { print n; };
def fib = fn (n) => { 
    if (n < 2)
        return n;
    
    return fib(n - 1) + fib(n - 2);   
};
call p(fib(15));
`;
console.log(`Code:\n${code}\n`);

const tokens = tokenize(code);
console.log("Tokens:\n", tokens, "\n");

const ast = parse(tokens);
console.log("AST:\n", ast, "\n");

console.log("Execute:");
execute(ast);
