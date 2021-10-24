import Link from 'next/link';
import {DateString} from '../DateString';
import type {PageData} from '../../pageList';
import {className} from './style.module.css';

export const PageLinkPublished = ({pathname, title, publishedAt, updatedAt}: PageData) => <li className={className.post}>
    <Link href={pathname}>
        <a className={className.link}>
            <span className={className.time}>
                <DateString date={publishedAt}/>
                {publishedAt < updatedAt && <>（<DateString date={updatedAt}/>更新）</>}
            </span>
            {title}
        </a>
    </Link>
</li>;

export const PageLinkUpdated = ({pathname, title, publishedAt, updatedAt}: PageData) => <li className={className.post}>
    <Link href={pathname}>
        <a className={className.link}>
            <span className={className.time}>
                <DateString date={updatedAt}/>更新
                {publishedAt < updatedAt && <>（<DateString date={publishedAt}/>公開）</>}
            </span>
            {title}
        </a>
    </Link>
</li>;
