describe('Simple Tests', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should test string operations', () => {
    expect('hello'.toUpperCase()).toBe('HELLO');
  });
});