import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const liffMock = vi.hoisted(() => ({
  isInClient: vi.fn(),
  sendMessages: vi.fn(),
  shareTargetPicker: vi.fn(),
  closeWindow: vi.fn(),
}));

vi.mock('@line/liff', () => ({ default: liffMock }));

import { closeLineWindow, shareLineMessage, type LineFlexMessage } from '../lib/liffShare';

const message: LineFlexMessage = { type: 'flex', altText: 'hi', contents: { type: 'bubble' } };

describe('shareLineMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, '', '/');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('sends to the current chat when running inside the LINE client', async () => {
    liffMock.isInClient.mockReturnValue(true);
    liffMock.sendMessages.mockResolvedValue(undefined);

    await expect(shareLineMessage(message)).resolves.toBe('sent');
    expect(liffMock.sendMessages).toHaveBeenCalledWith([message]);
    expect(liffMock.shareTargetPicker).not.toHaveBeenCalled();
  });

  it('falls back to shareTargetPicker when sendMessages fails', async () => {
    liffMock.isInClient.mockReturnValue(true);
    liffMock.sendMessages.mockRejectedValue(new Error('no permission'));
    liffMock.shareTargetPicker.mockResolvedValue({ status: 'success' });

    await expect(shareLineMessage(message)).resolves.toBe('shared');
  });

  it('reports cancelled when the user closes the target picker', async () => {
    liffMock.isInClient.mockReturnValue(false);
    liffMock.shareTargetPicker.mockResolvedValue(undefined);

    await expect(shareLineMessage(message)).resolves.toBe('cancelled');
    expect(liffMock.sendMessages).not.toHaveBeenCalled();
  });

  it('throws a readable error when no share API works', async () => {
    liffMock.isInClient.mockReturnValue(false);
    liffMock.shareTargetPicker.mockRejectedValue(new Error('not supported'));

    await expect(shareLineMessage(message)).rejects.toThrow('LINE 分享功能不可用');
  });

  it('simulates share failure with the share_unavailable dev preset', async () => {
    vi.stubEnv('VITE_LIFF_DEV', 'true');
    window.history.replaceState(null, '', '/?mockPreset=share_unavailable');

    await expect(shareLineMessage(message)).rejects.toThrow('share_unavailable');
    expect(liffMock.shareTargetPicker).not.toHaveBeenCalled();
  });
});

describe('closeLineWindow', () => {
  it('closes only inside the LINE client', () => {
    liffMock.isInClient.mockReturnValue(false);
    expect(closeLineWindow()).toBe(false);

    liffMock.isInClient.mockReturnValue(true);
    expect(closeLineWindow()).toBe(true);
    expect(liffMock.closeWindow).toHaveBeenCalled();
  });
});
