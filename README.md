# mlscanner.js
read emial box(rfc5321) address from text

- input

    ```
    mlscanbox('"Abc@exam","ple.",noise "com@exampl"@[0123:0123::0123] noise,"e.com..noise.noise"')
    //                                 ^ we can see email box rfc5321^
    ```

- output

    ```
        {
            result: 'found',
            found: {
                input: '"Abc@exam","ple.",noise "com@exampl"@[0123:0123::0123] noise,"e.com..noise.noise"',
                pos: { at: 36, appear: 24, end: 54 },
                addr: '"com@exampl"@[0123:0123::0123]'  // output is here !
            }
        }

        // "com@exampl"@[0123:0123::0123]
    ```


