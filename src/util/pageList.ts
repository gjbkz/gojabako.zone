// This file was generated by `npm run build:pageList`
/* eslint-disable */
import {JSON} from '../global';
export interface PageData {
    url: string,
    pathname: string,
    title: string,
    filePath: string,
    publishedAt: string,
    updatedAt: string,
    commitCount: number,
}
export const pageListByPublishedAt: Array<PageData> = JSON.parse(`[
{"pathname":"/2021/nextjs-https/","url":"https://gojabako.zone/2021/nextjs-https/","title":"Next.jsの開発環境をHTTPSにしました","filePath":"src/pages/2021/nextjs-https/index.page.md","publishedAt":"2021-10-11T00:26:45+09:00","updatedAt":"2021-10-11T19:35:39+09:00","commitCount":3},
{"pathname":"/2021/nextjs/","url":"https://gojabako.zone/2021/nextjs/","title":"サイトをNext.js + Vercelに移行しました","filePath":"src/pages/2021/nextjs/index.page.md","publishedAt":"2021-10-05T23:51:46+09:00","updatedAt":"2021-10-11T22:24:21+09:00","commitCount":9},
{"pathname":"/markdown","url":"https://gojabako.zone/markdown","title":"Markdownテストページ","filePath":"src/pages/markdown.page.md","publishedAt":"2021-09-30T00:39:26+09:00","updatedAt":"2021-10-10T10:15:20+09:00","commitCount":14},
{"pathname":"/","url":"https://gojabako.zone/","title":"トップページ","filePath":"src/pages/index.tsx","publishedAt":"2021-09-29T00:33:31+09:00","updatedAt":"2021-10-10T00:41:13+09:00","commitCount":12}
]`);
export const pageListByUpdatedAt: Array<PageData> = (JSON.parse("[1,0,2,3]") as Array<number>).map((index) => pageListByPublishedAt[index]);
