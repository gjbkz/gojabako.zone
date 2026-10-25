import Link from "next/link";
import type { HTMLAttributes } from "react";
import { classnames } from "../../util/classnames.ts";
import { site } from "../../util/site.ts";
import { Logo } from "../Logo";
import * as css from "./style.module.css";

export interface SiteHeaderProps extends HTMLAttributes<HTMLElement> {
	fullWidth?: boolean;
}

export const SiteHeader = ({ fullWidth, ...props }: SiteHeaderProps) => (
	<header
		{...props}
		className={classnames(
			css.container,
			fullWidth && css.full,
			props.className,
		)}
	>
		<Link href="/" prefetch={false}>
			<Logo className={css.logo} />
			<span>{site.name}</span>
		</Link>
		<Link href="/author" prefetch={false}>
			<span>Kei Ito</span>
		</Link>
	</header>
);
