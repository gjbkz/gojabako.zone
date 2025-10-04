import type {
	ButtonHTMLAttributes,
	HTMLAttributes,
	PropsWithChildren,
} from "react";
import { classnames, IconClass } from "../../util/classnames.ts";
import * as css from "./style.module.css";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	state?: "active" | "focus" | "hover";
	icon?: string;
}

const Button = ({
	state,
	icon,
	children,
	...props
}: PropsWithChildren<ButtonProps>) => (
	<button
		{...props}
		className={classnames(
			css.button,
			icon && css.icon,
			state === "active" && css.active,
			state === "focus" && css.focus,
			state === "hover" && css.hover,
			props.className,
		)}
	>
		{icon && <span className={classnames(IconClass, css.icon)}>{icon}</span>}
		<span>{children}</span>
	</button>
);

export const PrimaryButton = (props: PropsWithChildren<ButtonProps>) => (
	<Button {...props} className={classnames(css.primary, props.className)} />
);

export const SecondaryButton = (props: PropsWithChildren<ButtonProps>) => (
	<Button {...props} className={classnames(css.secondary, props.className)} />
);

export const TextButton = (props: PropsWithChildren<ButtonProps>) => (
	<Button {...props} className={classnames(css.text, props.className)} />
);

export const Buttons = (
	props: PropsWithChildren<HTMLAttributes<HTMLDivElement>>,
) => <div {...props} className={classnames(css.buttons, props.className)} />;
