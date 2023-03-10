
export interface Output {
    result: "found" | "not-found";
    found?: Found
}

export interface Found {
    addr: string;
    pos: Position;
    input: string;
}

// "wwwwww"@aaaaaaaaa.co
// hogehoge@fugafuga.com
// ^ appear^ at         ^ end
export interface Position {
    at: number;
    appear: number;
    end: number;
}

export const mlscanbox = (input: string): Output => {
    init(input);

    find();
    substr();

    return state.output;
};

interface State {
    current: {
        input: string;
        addr: string;
        pos: Position;
    },
    output: Output;
}
let state: State;

function init(input: string) {
    state = {
        current: {
            input,
            addr: "",
            pos: {
                at: -1,
                appear: -1,
                end: -1,
            }
        },
        output: {
            result: "not-found",
        },
    };
}


function find() {
    const current = state.current;

    const at = (x: string, p?: number) => input.lastIndexOf(x, p);
    const input = current.input;
    for (let pos = at("@"), end = input.length; pos !== -1 && pos < end; pos = at("@", pos - 1)) {
        current.pos = {
            at: pos,
            appear: -1,
            end: -1,
        };

        appear();
        if (state.output.result === "not-found") {
            continue;
        }
        host();
        if (state.output.result === "found") {
            return;
        }
    }

    state.output.result = "not-found";
}

function substr() {
    const input = state.current.input;
    const pos = state.output.found?.pos;
    if (pos) {
        state.output.found!.addr = input.substring(pos.appear, pos.end);
    }
}

function host() {
    // @a-z.A-Z.com
    // @abc
    // @abc.def
    // @[192.168.255.255]
    // @[2001:0db8::]
    // @[::2001:0db8]
    // @[2001::0db8]
    // @[2001:2001:2001:2001:2001:2001:2001:2001]
    const { input, pos } = state.current;

    const c = (x: number) => input.charAt(x);
    if (hchar(c(pos.at + 1))) {
        dname();
    } else if (c(pos.at + 1) === "[") {
        ipa();
    } else {
        state.output.result = "not-found";
    }
}

function dname() {
    const { input, pos } = state.current;
    const found = state.output.found;

    // @ aa
    //  ^
    // @..abc.def
    //  ^ 
    // @-abc.def
    //  ^ 
    const c = (x: number) => input.charAt(x);
    if (!hchar(c(pos.at + 1))) {
        state.output.result = "not-found";
        return;
    }

    // @a--bc
    //       ^
    // @abc.def
    //         ^
    // @a-z.A-Z.com
    //             ^
    // @abc.def-
    //          ^
    // @abc.def.
    //          ^
    // @abc.def...
    //            ^
    // @...
    //     ^
    let end = pos.at + 1;
    for (; end < input.length && hchar(c(end)); end++);

    // @abc.def-
    //         ^
    // @abc.def.
    //         ^
    // @abc.def...
    //         ^
    // @...
    //  ^
    for (; end > pos.at && hsign[c(end - 1)]; end--);
    if (pos.at === end) {
        state.output.result = "not-found";
        return;
    }

    // @abc.def..a
    //         ^
    const index = (x: string) => input.indexOf(x, pos.at + 1);
    const dd = index("..");
    if (dd !== -1 && dd < end) {
        end = dd;
    }

    // @abc-.def
    //     ^
    const hd = index("-.");
    if (hd !== -1 && hd < end) {
        end = hd;
    }

    // @abc.-def
    //     ^
    const dh = index(".-");
    if (dh !== -1 && dh < end) {
        end = dh;
    }

    if (found) {
        found.pos.end = end;
    }
}

function ipa() {
    const found = state.output.found;
    const current = state.current;
    const { input, pos } = current;

    let end = input.indexOf("]", pos.at + 2);
    if (end === -1) {
        state.output.result = "not-found";
        return;
    }

    if (found) {
        found.pos.end = end + 1;
    }

    current.addr = input.substring(pos.at + 2, end);
    if (current.addr.includes(".")) {
        v4();
    } else if (current.addr.includes(":")) {
        v6();
    } else {
        state.output.result = "not-found";
    }
}

function v4() {
    const output = state.output;

    // @[0.0.0.0]
    // @[192.168.255.255]
    const addr = state.current.addr;

    const v4 = addr.match(v4str);
    if (v4 && v4.filter((x, pos) => 1 <= pos && pos < 5).map(x => Number(x)).every(x => 0 <= x && x <= 255)) {
        output.result = "found";
    } else {
        output.result = "not-found";
    }
}

function v6() {
    const output = state.output;

    // @[2001::]
    // @[::0db8]
    // @[2001::0db8]
    // @[2001:2001:2001:2001:2001:2001:2001:2001]
    const addr = state.current.addr;

    if (!v6str.test(addr)) {
        output.result = "not-found";
        return;
    }

    const ip = addr.split(":");
    //  :: is once and max 8 x2-bytes hex-digs
    if (ip.filter(x => x).length <= 8 && addr.indexOf("::") === addr.lastIndexOf("::")) {
        output.result = "found";
    } else {
        output.result = "not-found";
    }
}

function appear() {
    const { input, pos } = state.current;

    // dot atoms
    // hoge@fuga.com   
    // 123@fuga.com     
    // !#$%&'*+-/=?^_`{|}~@fuga.com
    // a.a@fuga.com

    // quoted string
    // "()<>[]:;@, "@fuga.com
    // "\\\""@fuga.com

    // ^ find appear position

    const left = input.charAt(pos.at - 1);
    if (dachar(left)) {
        datoms();
    } else if (left === '"') {
        qstr();
    } else {
        state.output.result = "not-found";
    }
}

function datoms() {
    const { input, pos } = state.current;


    const c = (x: number) => input.charAt(x);
    const sd = (x: number) => input.charAt(x) === "." && input.charAt(x - 1) !== ".";
    let appear = pos.at - 1;
    for (; appear >= 0 && (dachar(c(appear)) || sd(appear)); appear--);

    if (sd(appear + 1)) {
        appear++;
    }

    //   dot atoms
    //   hoge@fuga.com   
    //   123@fuga.com     
    //   !#$%&'*+-/=?^_`{|}~@fuga.com
    //   a.a@fuga.com
    //...a.a@fuga.com
    // ..a.a@fuga.com
    //  .a.a@fuga.com

    //   ^ pos.appear will be here
    pos.appear = appear + 1;

    if (pos.appear === pos.at) {
        state.output.result = "not-found";
    } else {
        state.output = {
            result: "found",
            found: {
                input,
                pos,
                addr: "",
            }
        };
    }
}

function qstr() {
    const output = state.output;
    const { input, pos } = state.current;


    const c = (x: number) => input.charAt(x);
    let appear = pos.at - 2;
    for (; appear >= 0 && !(c(appear) === '"' && c(appear) !== '\\'); appear--);

    // quoted string
    // "()<>[]:;@, "@fuga.com
    // "\\\""@fuga.com

    // ^ pos.appear; check quoted string contents surrounded by "
    pos.appear = appear;
    qcheck();

    if (pos.appear === pos.at) {
        state.output = {
            result: "not-found",
        };
    } else {
        state.output = {
            result: "found",
            found: {
                input,
                pos,
                addr: "",
            }
        };
    }
}

function qcheck() {
    const { input, pos } = state.current;

    if (pos.appear === -1) {
        pos.appear = pos.at;
        return;
    }

    const c = (x: number) => input.charAt(x);
    const pair = (x: number, c: string) => input.charAt(x) === '\\' && input.charAt(x + 1) === c;
    for (let appear = pos.appear + 1, end = pos.at - 1; appear < end;) {
        if (qpchar(c(appear))) {
            appear++;
        } else if (pair(appear, '\\') || pair(appear, '"')) {
            appear += 2;
        } else {
            pos.appear = pos.at;
            return;
        }
    }
}

function qpchar(c: string) {
    return dachar(c) || qsign[c];
}

function dachar(c: string) {
    return alpha(c) || dig(c) || nsign[c];
}

function hchar(c: string) {
    return alpha(c) || dig(c) || hsign[c];
}

function alpha(c: string) {
    return ("a" <= c && c <= "z") || ("A" <= c && c <= "Z");
}

function dig(c: string) {
    return "0" <= c && c <= "9";
}

const qsign: { [c in string]: number } = {
    "(": 1,
    ")": 1,
    "<": 1,
    ">": 1,
    "[": 1,
    "]": 1,
    ":": 1,
    ";": 1,
    "@": 1,
    ",": 1,
    ".": 1,
    " ": 1,
};

const nsign: { [c in string]: number } = {
    "!": 1,
    "#": 1,
    "$": 1,
    "%": 1,
    "&": 1,
    "'": 1,
    "*": 1,
    "+": 1,
    "-": 1,
    "/": 1,
    "=": 1,
    "?": 1,
    "^": 1,
    "_": 1,
    "`": 1,
    "{": 1,
    "|": 1,
    "}": 1,
    "~": 1,
};

const hsign: { [c in string]: number } = {
    "-": 1,
    ".": 1,
};

const v4str = /^([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/;
const v6str = /^(\:\:)?([0-9a-fA-F]{1,4})(\:\:?([0-9a-fA-F]{1,4})){0,7}(\:\:)?$/;
