"use client";
import { useEffect, useState } from "react";
import { IconClass } from "../../util/classnames";
import { useIsInView } from "../use/IsInView";
import * as css from "./style.module.css";

export const AppHost = () => {
	const [div, setDiv] = useState<HTMLElement | null>(null);
	const [appHost, setAppHost] = useState("Loading");
	const [hidden, setHidden] = useState(true);
	const isInView = useIsInView(div);
	useEffect(() => {
		if (isInView) {
			setHidden(false);
		}
	}, [isInView]);
	useEffect(() => {
		const abc = new AbortController();
		if (!hidden) {
			fetch("/apphost", { signal: abc.signal })
				.then(async (res) => {
					if (res.ok) {
						setAppHost(await res.json());
					} else {
						throw new Error(`${res.status} ${res.statusText}`);
					}
				})
				.catch((err) => {
					console.error(err);
					setAppHost("Failed");
				});
		}
		return () => abc.abort();
	}, [hidden]);
	return (
		<div className={css.host} ref={setDiv}>
			<span className={IconClass}>
				{isInView && appHost ? "cloud_done" : "cloud"}
			</span>
			<code>{appHost}</code>
		</div>
	);
};
