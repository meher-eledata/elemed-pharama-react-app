import { toCsv, downloadCsv, guardCsvText } from '../csv';

describe('toCsv', () => {
  it('quotes every cell, uses the record keys as headers and CRLF rows', () => {
    expect(toCsv([{ Name: 'Dolo 650', Qty: '10.00' }, { Name: 'ORS', Qty: 3 }])).toBe(
      '"Name","Qty"\r\n"Dolo 650","10.00"\r\n"ORS","3"'
    );
  });

  it('doubles embedded quotes so a name cannot break the row', () => {
    expect(toCsv([{ Product: 'Crepe Bandage 4"', Code: 'CB4' }])).toBe(
      '"Product","Code"\r\n"Crepe Bandage 4""","CB4"'
    );
  });

  it('keeps commas and newlines inside one cell', () => {
    expect(toCsv([{ Address: 'Shop 4, MG Road\nPune', Pin: '411001' }])).toBe(
      '"Address","Pin"\r\n"Shop 4, MG Road\nPune","411001"'
    );
  });

  it('neutralises a formula smuggled after a quote break-out attempt', () => {
    // Without quote doubling this became `"IT Break","=1+2"` - a separate, live formula cell.
    expect(toCsv([{ Product: 'IT Break","=1+2', Code: 'X' }])).toBe(
      '"Product","Code"\r\n"IT Break"",""=1+2","X"'
    );
    expect(toCsv([{ Product: '=1+2' }])).toBe('"Product"\r\n"\'=1+2"');
  });

  it.each(['=HYPERLINK("http://x","y")', '+1+1', '-1+cmd', '@SUM(A1)', '\tdata', '\rdata', '--', '-4,000.00'])(
    'guards formula-like text %j with a leading apostrophe',
    (val) => {
      expect(guardCsvText(val)).toBe(`'${val}`);
    }
  );

  it.each(['-4.00', '-12', '0', '42.5', '-', 'a=b', 'Amoxicillin'])('leaves %j unchanged', (val) => {
    expect(guardCsvText(val)).toBe(val);
  });

  it('writes numbers (incl. negatives) as-is and null/undefined as empty cells', () => {
    expect(toCsv([{ a: -4, b: 0, c: null, d: undefined }])).toBe('"a","b","c","d"\r\n"-4","0","",""');
  });

  it('defaults the headers to every key across the records, in first-seen order', () => {
    expect(toCsv([{ a: '1' }, { a: '2', b: '3' }])).toBe('"a","b"\r\n"1",""\r\n"2","3"');
  });

  it('honours explicit headers (order, and missing keys as empty cells)', () => {
    expect(toCsv([{ b: '2', a: '1' }], ['a', 'b', 'c'])).toBe('"a","b","c"\r\n"1","2",""');
  });

  it('returns just the header row for no records when headers are given, and "" otherwise', () => {
    expect(toCsv([], ['a', 'b'])).toBe('"a","b"');
    expect(toCsv([])).toBe('');
  });
});

describe('downloadCsv', () => {
  const realCreate = URL.createObjectURL;
  const realRevoke = URL.revokeObjectURL;
  afterEach(() => {
    URL.createObjectURL = realCreate;
    URL.revokeObjectURL = realRevoke;
    jest.useRealTimers();
  });

  it('saves a UTF-8 BOM-prefixed CSV under the filename and revokes the URL', async () => {
    jest.useFakeTimers();
    let blob: Blob | undefined;
    URL.createObjectURL = jest.fn((b: Blob) => {
      blob = b;
      return 'blob:csv';
    });
    URL.revokeObjectURL = jest.fn();
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('report_2026-10-17.csv');
      expect(this.getAttribute('href')).toBe('blob:csv');
    });

    downloadCsv('report_2026-10-17.csv', [{ Name: 'Crème ₹', Qty: '1.00' }]);

    expect(click).toHaveBeenCalledTimes(1);
    expect(blob!.type).toBe('text/csv;charset=utf-8');
    const bytes = new Uint8Array(
      await new Promise<ArrayBuffer>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.readAsArrayBuffer(blob!);
      })
    );
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder().decode(bytes.slice(3))).toBe('"Name","Qty"\r\n"Crème ₹","1.00"');
    expect(document.querySelector('a[download]')).toBeNull();
    jest.runAllTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:csv');
    click.mockRestore();
  });
});
