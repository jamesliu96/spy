import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getDocument } from 'pdfjs-dist/webpack';
import type {
  PDFDocumentProxy,
  PDFPageProxy,
  TextItem,
} from 'pdfjs-dist/types/src/display/api';

import dataPDF from './中华人民共和国治安管理处罚法(修订草案).pdf';

import './App.css';

const LOCALE = 'zh-CN';
const SCALE = 1;

const PITCH = 2;
const RATE = 2;

const chunk = (str: string, size: number) => [
  ...str
    .split('')
    .reduce(
      (acc, _, idx) =>
        idx % size ? acc : [...acc, str.slice(idx, idx + size)],
      [] as string[]
    ),
];

const App: FC = () => {
  const [started, setStarted] = useState(false);

  const [doc, setDoc] = useState<PDFDocumentProxy>();
  useEffect(() => {
    (async () => {
      setDoc(await getDocument(dataPDF).promise);
    })();
  }, []);

  const [pages, setPages] = useState<PDFPageProxy[]>();
  useEffect(() => {
    if (doc)
      (async () => {
        const p = [];
        for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++)
          p.push(doc.getPage(pageNumber));
        setPages(await Promise.all(p));
      })();
  }, [doc]);

  const [text, setText] = useState<string>();
  useEffect(() => {
    if (pages)
      (async () => {
        setText(
          (await Promise.all(pages.map((x) => x.getTextContent())))
            .flatMap(({ items }) => items as TextItem[])
            .map(({ str }) => str)
            .join('')
        );
      })();
  }, [pages]);

  const chunks = useMemo(() => {
    if (text) {
      try {
        return Array.from(
          new Intl.Segmenter(LOCALE, { granularity: 'sentence' }).segment(text)
        ).map((x) => x.segment);
      } catch {}
      return chunk(text, 10);
    }
  }, [text]);

  const utterances = useMemo(
    () =>
      chunks?.map((chunk) => {
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.lang = LOCALE;
        utterance.pitch = Math.random()*PITCH;
        utterance.rate = RATE;
        return utterance;
      }),
    [chunks]
  );

  const refs = useRef<HTMLCanvasElement[]>([]);
  const handleStart = useCallback(() => {
    setStarted(true);
    if (pages)
      for (const page of pages) {
        const canvasContext = refs.current[page.pageNumber].getContext('2d');
        if (canvasContext) {
          const viewport = page.getViewport({ scale: SCALE });
          page.render({
            canvasContext,
            viewport,
            transform: [devicePixelRatio, 0, 0, devicePixelRatio, 0, 0],
          });
        }
      }
    if (utterances)
      for (const utterance of utterances) speechSynthesis.speak(utterance);
  }, [pages, utterances]);

  useEffect(
    () => () => {
      speechSynthesis.cancel();
    },
    []
  );

  return (
    <div className="App">
      <object
        className="pdf"
        style={{ visibility: started ? undefined : 'hidden' }}
        data={dataPDF}
        type="application/pdf"
      >
        <div>
          {pages?.map((page) => {
            const viewport = page.getViewport({ scale: SCALE });
            return (
              <canvas
                key={page.pageNumber}
                ref={(ref) => {
                  if (ref) refs.current[page.pageNumber] = ref;
                }}
                width={viewport.width * devicePixelRatio}
                height={viewport.height * devicePixelRatio}
                style={{
                  width: viewport.width,
                  height: viewport.height,
                }}
              />
            );
          })}
        </div>
      </object>
      {utterances?.length && !started ? (
        <div className="start" onClick={handleStart}>
          中华人民共和国治安管理处罚法(修订草案).pdf
        </div>
      ) : null}
    </div>
  );
};

export default App;
