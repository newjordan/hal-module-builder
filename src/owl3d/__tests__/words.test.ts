import { captionPages, eventWord, stateWord, toolWord } from '../words';

describe('chunky words', () => {
  it('names every agent state with one word', () => {
    expect(stateWord('processing')).toBe('WORKING');
    expect(stateWord('thinking')).toBe('THINKING');
    expect(stateWord('completed')).toBe('DONE');
  });

  it('turns tools into one short word', () => {
    expect(toolWord('Bash')).toBe('RUN');
    expect(toolWord('Edit')).toBe('EDIT');
    expect(toolWord('MultiEdit')).toBe('EDIT');
    expect(toolWord('Read')).toBe('READ');
    expect(toolWord('Grep')).toBe('SEARCH');
    expect(toolWord('Glob')).toBe('SEARCH');
    expect(toolWord('WebFetch')).toBe('WEB');
    expect(toolWord('Agent')).toBe('AGENTS');
    expect(toolWord('mcp__github__create_pr')).toBe('TOOL');
    expect(toolWord('Frobnicate')).toBe('FROBNIC');
    expect(toolWord('')).toBe('TOOL');
  });

  it('labels only the events worth a word', () => {
    expect(eventWord({ kind: 'tool', state: 'processing', tool: 'Bash' })).toBe(
      'RUN'
    );
    expect(
      eventWord({ kind: 'tool', state: 'thinking', tool: 'Bash' })
    ).toBeNull();
    expect(eventWord({ kind: 'message', stage: 'intake' })).toBe('NEW TASK');
    expect(eventWord({ kind: 'message', stage: 'deliver' })).toBe('REPLY');
    expect(eventWord({ kind: 'completion' })).toBe('DONE');
    expect(eventWord({ kind: 'approval' })).toBe('APPROVE?');
    expect(eventWord({ kind: 'thought' })).toBeNull();
  });
});

describe('captionPages', () => {
  it('pages speech into two short lines at a time', () => {
    const pages = captionPages(
      'Push to talk is ready. Hold the red dot and speak to me.'
    );
    expect(pages.every(page => page.length <= 2)).toBe(true);
    expect(pages.flat().every(line => line.length <= 18)).toBe(true);
    expect(pages.flat().join(' ')).toBe(
      'Push to talk is ready. Hold the red dot and speak to me.'
    );
  });

  it('cuts a word too long for a line', () => {
    expect(captionPages('supercalifragilisticexpialidocious', 10)).toEqual([
      ['supercali…'],
    ]);
  });

  it('handles empty text', () => {
    expect(captionPages('   ')).toEqual([]);
  });
});
