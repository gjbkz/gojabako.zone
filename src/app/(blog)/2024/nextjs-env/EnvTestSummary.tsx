import { classnames, IconClass } from "../../../../util/classnames";
import { gridArea } from "../../../../util/gridArea";
import { listEnvTestEntries } from "../../../../util/testEnv";
import { MathRef } from "./MathRef";
import style from "./style.module.css";

const allResult: Array<[string, Record<string, string>]> = [
	[
		"Cloud Run",
		{
			Ymiddle: "E,C,H,C,H,C,E,C,H,C,E,C,E,,,E,E,,E,,,E,E,",
			Yserver: "E,C,,C,E,C,E,C,,C,E,C,E,,,E,E,,E,,,E,E,",
			Yroute: "E,C,H,C,H,C,E,C,H,C,E,C,E,,,E,E,,E,,,E,E,",
			Yclient: ",C,,C,,C,E,C,,C,E,C,E,,,E,E,,E,,,E,E,",
		},
	],
	[
		"Amplify",
		{
			Ymiddle: "E,C,,C,E,C,E,C,H,C,H,C,E,,H,E,H,H,E,,H,E,H,H",
			Yserver: "E,C,H,C,H,C,E,C,H,C,H,C,E,,H,E,H,H,E,,H,E,H,H",
			Yroute: "E,C,,C,E,C,E,C,H,C,H,C,E,,H,E,H,H,E,,H,E,H,H",
			Yclient: ",C,,C,,C,E,C,H,C,H,C,E,,H,E,H,H,E,,H,E,H,H",
		},
	],
	[
		"Netlify",
		{
			Ymiddle: ",C,H,C,H,C,E,C,H,C,H,C,E,,H,E,H,H,E,,H,E,H,H",
			Yserver: "E,C,H,C,H,C,E,C,H,C,H,C,E,,H,E,H,H,E,,H,E,H,H",
			Yroute: "E,C,H,C,H,C,E,C,H,C,H,C,E,,H,E,H,H,E,,H,E,H,H",
			Yclient: ",C,,C,,C,E,C,H,C,H,C,E,,H,E,H,H,E,,H,E,H,H",
		},
	],
	[
		"Vercel",
		{
			Ymiddle: ",C,H,C,H,C,E,C,H,C,H,C,E,,H,E,H,H,E,,H,E,H,H",
			Yserver: "E,C,H,C,H,C,E,C,H,C,H,C,E,,H,E,H,H,E,,H,E,H,H",
			Yroute: "E,C,H,C,H,C,E,C,H,C,H,C,E,,H,E,H,H,E,,H,E,H,H",
			Yclient: ",C,,C,,C,E,C,H,C,H,C,E,,H,E,H,H,E,,H,E,H,H",
		},
	],
];

export const EnvTestSummary = () => {
	const id = "table-summary";
	const envNameList = [
		...(function* () {
			for (const [name] of listEnvTestEntries()) {
				yield name;
			}
		})(),
	];
	const headingRowCount = 2;
	const headingColumnCount = 1;
	return (
		<figure id={id} data-type="table">
			<figcaption>
				<span />
				<a href={`#${id}`} className="fragment-ref">
					#{id}
				</a>
			</figcaption>
			<div className={style.wrapper}>
				<div className={style.table}>
					<div
						className={classnames(
							style.firstColumn,
							style.heading,
							style.label,
						)}
						style={gridArea(1, 1, 2, 2)}
					>
						環境変数の設定
					</div>
					<div
						className={classnames(style.firstColumn, style.heading)}
						style={gridArea(2, 1, 3, 2)}
					>
						{["Xenv", "Xconf", "Xhost"].map((refId) => (
							<MathRef key={`heading2-${refId}`} refId={refId} />
						))}
					</div>
					{envNameList.map((envName, i) => {
						const row = i + 1 + headingRowCount;
						const isPublic = envName.startsWith("NEXT_PUBLIC_");
						const hasEnv = envName.includes("_ENV");
						const hasCnf = envName.includes("_CNF");
						const hasHst = envName.includes("_HST");
						return (
							<div
								key={`heading_${envName}`}
								title={envName}
								className={classnames(
									style.firstColumn,
									style.heading,
									style.input,
								)}
								style={gridArea(row, 1, row + 1, 2)}
							>
								<span className={style.no}>{i + 1}.</span>
								<span className={classnames(IconClass)}>
									{isPublic ? "public" : "remove"}
								</span>
								<span className={classnames(!hasEnv && IconClass)}>
									{hasEnv ? "E" : "remove"}
								</span>
								<span className={classnames(!hasCnf && IconClass)}>
									{hasCnf ? "C" : "remove"}
								</span>
								<span className={classnames(!hasHst && IconClass)}>
									{hasHst ? "H" : "remove"}
								</span>
							</div>
						);
					})}
					{[
						...(function* () {
							let start = headingColumnCount + 1;
							for (const [hostIndex, [title1, result]] of allResult.entries()) {
								const odd = hostIndex % 2;
								let column = start;
								for (const [refId, csv] of Object.entries(result)) {
									yield (
										<MathRef
											key={`heading2-${title1}-${refId}`}
											className={classnames(
												style.heading,
												odd ? style.odd : style.even,
											)}
											style={gridArea(2, column, 3, column + 1)}
											refId={refId}
										/>
									);
									for (const [i, value] of csv.split(",").entries()) {
										const envName = envNameList[i];
										const row = headingRowCount + i + 1;
										yield (
											<div
												key={`${title1}-${refId}-${envName}`}
												className={odd ? style.odd : style.even}
												style={gridArea(row, column, row + 1, column + 1)}
											>
												{value.trim().slice(0, 1).toUpperCase()}
											</div>
										);
									}
									column += 1;
								}
								yield (
									<div
										key={title1}
										className={classnames(
											style.heading,
											style.label,
											odd ? style.odd : style.even,
										)}
										style={gridArea(1, start, 2, column)}
									>
										{title1}
									</div>
								);
								start = column;
							}
						})(),
					]}
				</div>
			</div>
		</figure>
	);
};
