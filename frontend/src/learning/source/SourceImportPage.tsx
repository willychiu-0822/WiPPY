import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLearningApi } from '../api/learningApiContextValue';
import type { CreateLearningSourceRequest } from '../api/types';

const MAX_BODY_CHARS = 50_000;
const MAX_PARAGRAPHS = 400;

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function paragraphCount(body: string): number {
  return body.split(/\r?\n/).filter((line) => line.trim() !== '').length;
}

export function SourceImportPage() {
  const api = useLearningApi();
  const navigate = useNavigate();
  const requestIdRef = useRef<string | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [url, setUrl] = useState('');
  const [learningObjective, setLearningObjective] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    if (!requestIdRef.current) requestIdRef.current = crypto.randomUUID();
    const payload: CreateLearningSourceRequest = {
      requestId: requestIdRef.current,
      title: title.trim(),
      author: optionalText(author),
      url: optionalText(url),
      learningObjective: optionalText(learningObjective),
      body,
    };
    try {
      const result = await api.createSource(payload);
      navigate(`/learn/sources/${result.sourceId}?run=${result.runId}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '無法收進知識庫');
    } finally {
      setSubmitting(false);
    }
  }

  const paragraphs = paragraphCount(body);

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">加入英文來源</h1>
        <p className="mt-1 text-sm text-gray-600">貼上你想讀的英文內容。原始連結只作為出處資訊保存。</p>
      </div>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <label className="block text-sm font-medium text-gray-700">
        標題
        <input required value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2" />
      </label>

      <label className="block text-sm font-medium text-gray-700">
        作者（選填）
        <input value={author} onChange={(event) => setAuthor(event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2" />
      </label>

      <label className="block text-sm font-medium text-gray-700">
        原始連結（選填）
        <input
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
        />
      </label>

      <label className="block text-sm font-medium text-gray-700">
        這次想理解什麼（選填）
        <input
          value={learningObjective}
          onChange={(event) => setLearningObjective(event.target.value)}
          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
        />
      </label>

      <label className="block text-sm font-medium text-gray-700">
        英文內容
        <textarea
          required
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={12}
          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 leading-7"
        />
      </label>
      <p className="text-xs text-gray-500">
        {body.length}/{MAX_BODY_CHARS} 字元 · {paragraphs}/{MAX_PARAGRAPHS} 段落
      </p>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-blue-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        收進知識庫
      </button>
    </form>
  );
}
