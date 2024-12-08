import style from "./style.module.scss";

interface EnvTestDataProps {
	data: Array<[string, string | undefined]>;
	columnName: string;
}

export const EnvTestData = ({ data, columnName }: EnvTestDataProps) => (
	<pre className={style.data} data-column-name={columnName}>
		{[
			...(function* () {
				for (const [k, v] of data) {
					yield `${k}=${v || ""}`;
				}
			})(),
		].join("\n")}
	</pre>
);
