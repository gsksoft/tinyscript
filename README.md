# tinyscript

## Examples

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
