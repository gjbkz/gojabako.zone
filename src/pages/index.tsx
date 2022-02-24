import Link from 'next/link';
import {authorName} from '../../packages/site/constants';
import {HtmlHead} from '../components/HtmlHead';
import {PageLinkUpdated} from '../components/PageLink';
import {PageTitle} from '../components/PageTitle';
import {pageListByUpdatedAt} from '../pageList';

export const Page = () => <>
    <HtmlHead pathname="" description={`${authorName}のWebサイトです。`}/>
    <main>
        <article>
            <PageTitle pathname="" onlyUpdate={true}/>
            <h2>最近の更新</h2>
            <ul>{pageListByUpdatedAt.slice(0, 4).map((page) => <li key={page.pathname}><PageLinkUpdated {...page}/></li>)}</ul>
            <h2>管理者</h2>
            <ul>
                <li><Link href="/author"><a>伊藤 慶 - Kei Ito</a></Link></li>
            </ul>
        </article>
    </main>
</>;

export default Page;
