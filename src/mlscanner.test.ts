const { mlscanbox } = require('../dist/mlscanner');


describe('address scanner', () => {
    it('avoid no email box', () => {
        expect(mlscanbox('').result).toBe('not-found');
        expect(mlscanbox(' ').result).toBe('not-found');
        expect(mlscanbox('abvc').result).toBe('not-found');
        expect(mlscanbox('awd').result).toBe('not-found');
        expect(mlscanbox('test aa').result).toBe('not-found');
        expect(mlscanbox('!zz dw+~').result).toBe('not-found');
        expect(mlscanbox('Abc.@example.com').result).toBe('not-found');
        expect(mlscanbox('Abc."@example.com').result).toBe('not-found');
        expect(mlscanbox('Abc@example.com').result).toBe('not-found');
        expect(mlscanbox('Abc@[]').result).toBe('not-found');
        expect(mlscanbox('Abc@[[]').result).toBe('not-found');
        expect(mlscanbox('Abc@[]]').result).toBe('not-found');
        expect(mlscanbox('Abc@[0.0.0.0[]').result).toBe('not-found');
        expect(mlscanbox('Abc@[[0.0.0.0]').result).toBe('not-found');
        expect(mlscanbox('Abc@[0.0.0.0[0.0.0.0]').result).toBe('not-found');
        expect(mlscanbox('Abc@[ffff::[]').result).toBe('not-found');
        expect(mlscanbox('Abc@[[ffff::]').result).toBe('not-found');
        expect(mlscanbox('Abc@[ffff::[ffff::]').result).toBe('not-found');
        expect(mlscanbox('Abc@[f::f::f]').result).toBe('not-found');
    });

    it('through emailbox box', () => {
        let a = mlscanbox('a@b');
        let result = a.result;
        let addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('a@b');

        a = mlscanbox('    a@b  ');
        result = a.result;
        addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('a@b');

        a = mlscanbox('w@b    a@b  ');
        result = a.result;
        addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('a@b');

        a = mlscanbox('w@b    a@b  ');
        result = a.result;
        addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('a@b');

        a = mlscanbox('Abc@example.com');
        result = a.result;
        addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('Abc@example.com');

        a = mlscanbox('Abc.123@example.com');
        result = a.result;
        addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('Abc.123@example.com');

        a = mlscanbox('user+mailbox/department=shipping@example.com');
        result = a.result;
        addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('user+mailbox/department=shipping@example.com');

        a = mlscanbox("!#$%&'*+-/=?^_`.{|}~@example.com");
        result = a.result;
        addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe("!#$%&'*+-/=?^_`.{|}~@example.com");

        a = mlscanbox('"Abc@def"@example.com');
        result = a.result;
        addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('"Abc@def"@example.com');

        a = mlscanbox('"Fred\ Bloggs"@example.com');
        result = a.result;
        addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('"Fred\ Bloggs"@example.com');

        a = mlscanbox('"Joe.\\\\Blow"@example.com');
        result = a.result;
        addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('"Joe.\\\\Blow"@example.com');

        a = mlscanbox('Abc..123@example.com');
        //                  ^              ^ can be read as a rfc5321 
        result = a.result;
        addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('123@example.com');
    });

    it('scan email box avoiding noise text', () => {
        let a = mlscanbox('a@b');
        let result = a.result;
        let addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('a@b');

        a = mlscanbox('..noise.noise"Abc@example.com"@example.com..noise.noise');
        result = a.result;
        addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('"Abc@example.com"@example.com');

        a = mlscanbox('Abc@exam"ple.com@example.com..noise.noise');
        result = a.result;
        addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('ple.com@example.com');

        a = mlscanbox('"Abc@exam","ple.","com@exampl","e.com..noise.noise"');
        result = a.result;
        addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('com@exampl');

        a = mlscanbox('"Abc@exam","ple.","com@exampl"@a,"e.com..noise.noise"');
        result = a.result;
        addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('"com@exampl"@a');

        a = mlscanbox('"Abc@exam","ple.",noise"com@exampl"@a..noise,"e.com..noise.noise"');
        result = a.result;
        addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('"com@exampl"@a');

        a = mlscanbox('"Abc@exam","ple.",noise,"com@exampl"@a,noise,"e.com..noise.noise"');
        result = a.result;
        addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('"com@exampl"@a');

        a = mlscanbox('"Abc@exam","ple.",noise "com@exampl"@a noise,"e.com..noise.noise"');
        result = a.result;
        addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('"com@exampl"@a');
    });


    it('scan email box avoiding noise text with host name ', () => {
        let a = mlscanbox('a@[0.0.1.1]');
        let result = a.result;
        let addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('a@[0.0.1.1]');

        a = mlscanbox('..noise.noise"Abc@example.com"@[0:00::]..noise.noise');
        result = a.result;
        addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('"Abc@example.com"@[0:00::]');

        a = mlscanbox('Abc@exam"ple.com@[0:00::]..noise.noise');
        result = a.result;
        addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('ple.com@[0:00::]');

        a = mlscanbox('"Abc@exam","ple.","com@[::f]","e.com..noise.noise"');
        result = a.result;
        addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('com@[::f]');

        a = mlscanbox('"Abc@exam","ple.","com@[::f]"@a,"e.com..noise.noise"');
        result = a.result;
        addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('"com@[::f]"@a');

        a = mlscanbox('"Abc@exam","ple.",noise"com@[ff:ff:ff:ff:ff:ff:ff:ff]"@a..noise,"e.com..noise.noise"');
        result = a.result;
        addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('"com@[ff:ff:ff:ff:ff:ff:ff:ff]"@a');

        a = mlscanbox('"Abc@exam","ple.",noise,"com@exampl"@[0123:0123::0123],noise,"e.com..noise.noise"');
        result = a.result;
        addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('"com@exampl"@[0123:0123::0123]');

        a = mlscanbox('"Abc@exam","ple.",noise "com@exampl"@[0123:0123::0123] noise,"e.com..noise.noise"');
        result = a.result;
        addr = a.found?.addr;
        expect(result).toBe('found');
        expect(addr).toBe('"com@exampl"@[0123:0123::0123]');
        console.log(a)
    });
});