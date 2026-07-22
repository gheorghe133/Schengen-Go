import { buildMonthGrid, validateDateRange } from './date-utils';

describe('buildMonthGrid', () => {
  it('builds full weeks starting on Monday, padding with adjacent-month days', () => {
    // January 2024 starts on a Monday, so no leading padding is needed.
    const grid = buildMonthGrid(2024, 0);

    expect(grid.length % 7).toBe(0);
    expect(grid[0]).toEqual({ date: '2024-01-01', inMonth: true });
    expect(grid[30]).toEqual({ date: '2024-01-31', inMonth: true });
    expect(grid[31]).toEqual({ date: '2024-02-01', inMonth: false });
  });

  it('pads leading days from the previous month when the 1st is not a Monday', () => {
    // February 2024 starts on a Thursday.
    const grid = buildMonthGrid(2024, 1);

    expect(grid[0].inMonth).toBe(false);
    expect(grid[0].date).toBe('2024-01-29');
    const firstInMonth = grid.findIndex((day) => day.inMonth);
    expect(grid[firstInMonth]).toEqual({ date: '2024-02-01', inMonth: true });
  });
});

describe('validateDateRange', () => {
  it('requires both dates', () => {
    expect(validateDateRange('', '2024-01-10')).toBe('Completează ambele date.');
    expect(validateDateRange('2024-01-01', '')).toBe('Completează ambele date.');
  });

  it('rejects an exit date before the entry date', () => {
    expect(validateDateRange('2024-01-10', '2024-01-01')).toBe(
      'Data de intrare trebuie să fie înainte de data de ieșire.',
    );
  });

  it('accepts a valid range, including a single-day trip', () => {
    expect(validateDateRange('2024-01-01', '2024-01-10')).toBeNull();
    expect(validateDateRange('2024-01-01', '2024-01-01')).toBeNull();
  });
});
