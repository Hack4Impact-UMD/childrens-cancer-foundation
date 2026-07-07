import { toDraftDocData } from "./draft-serialization";

describe("toDraftDocData", () => {
    test("strips the file key when it holds a File", () => {
        const file = new File(["x"], "a.pdf", { type: "application/pdf" });
        const out = toDraftDocData({ title: "t", file });
        expect(out).toEqual({ title: "t" });
        expect("file" in out).toBe(false);
    });

    test("strips the file key regardless of value (null too)", () => {
        const out = toDraftDocData({ title: "t", file: null });
        expect("file" in out).toBe(false);
    });

    test("strips undefined values but keeps '', false, 0, and null on other keys", () => {
        const out = toDraftDocData({
            gone: undefined,
            empty: "",
            flag: false,
            zero: 0,
            nothing: null,
        });
        expect(out).toEqual({ empty: "", flag: false, zero: 0, nothing: null });
    });

    test("passes through plain data untouched", () => {
        const out = toDraftDocData({ title: "t", coPI: false });
        expect(out).toEqual({ title: "t", coPI: false });
    });

    test("strips File/Blob values under any key", () => {
        const blob = new Blob(["x"], { type: "application/pdf" });
        const out = toDraftDocData({ title: "t", attachment: blob });
        expect(out).toEqual({ title: "t" });
    });
});
