/**
 * Live header: two team names and numeric score (from match or derived).
 */
export default function Scoreboard({
  teamLocalName,
  teamVisitorName,
  goalsLocal,
  goalsVisitor,
}) {
  return (
    <svg id="Capa_2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2381.62 285.06">
      <defs>
      </defs>
      <g id="Capa_1-2" data-name="Capa_1">
        <path class="cls-7" d="M1712.24,7.98v269.11h400.27c148.01,0,269.11-121.1,269.11-269.1h0s-669.37,0-669.37,0Z"/>
        <path class="cls-1" d="M1659.1,7.98v269.11h400.27c148.01,0,269.11-121.1,269.11-269.1h0s-669.37,0-669.37,0Z"/>
        <path class="cls-7" d="M669.37,7.98v269.11h-400.27C121.1,277.08,0,155.99,0,7.98h0s669.37,0,669.37,0Z"/>
        <path class="cls-2" d="M722.51,7.98v269.11h-400.27C174.23,277.08,53.14,155.99,53.14,7.98h0s669.37,0,669.37,0Z"/>
        <path class="cls-6" d="M325.61,7.98h0c0,148.62,120.48,269.11,269.11,269.11h1192.19c148.01,0,269.11-121.1,269.11-269.1h0s-1730.4,0-1730.4,0Z"/>
        <path class="cls-5" d="M414.31,7.98h0c0,133.39,108.13,241.52,241.51,241.52h1069.96c132.83,0,241.51-108.68,241.51-241.51h0s-1552.99,0-1552.99,0Z"/>
        <polygon class="cls-1" points="1365.63 285.06 1015.99 285.06 897.67 0 1483.94 0 1365.63 285.06"/>
        <polygon class="cls-9" points="1440.12 105.59 1483.94 0 897.67 0 941.5 105.59 1440.12 105.59"/>
        <text class="cls-3" transform="translate(497.7 159.05)"><tspan x="0" y="15">{teamLocalName}</tspan></text>
        <text class="cls-3" transform="translate(1488.06 159.48)"><tspan x="0" y="15">{teamVisitorName}</tspan></text>
        <text class={goalsLocal >9 || goalsVisitor >9 ? "cls-4" : "cls-4 cls-44"} transform="translate(1048.84 198.89)"><tspan x={goalsLocal >9 || goalsVisitor >9 ? "-20px" : "-20px"} y="0">{goalsLocal ?? 0}-{goalsVisitor ?? 0}</tspan></text>
      </g>
    </svg>
  )
}
