import { Route, Routes } from "react-router-dom"
import MainLayout from "./layout/MainLayout.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import Teams from "./pages/Teams.jsx"
import Players from "./pages/Players.jsx"
import Matches from "./pages/Matches.jsx"
import LiveMatch from "./pages/LiveMatch.jsx"
import Standings from "./pages/Standings.jsx"

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/players" element={<Players />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/match/:id" element={<LiveMatch />} />
        <Route path="/standings" element={<Standings />} />
      </Route>
    </Routes>
  )
}

export default App
