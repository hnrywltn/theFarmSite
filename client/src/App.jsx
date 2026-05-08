import Nav from './components/Nav'
import Hero from './components/Hero'
import About from './components/About'
import TheLand from './components/TheLand'
// import Contact from './components/Contact'
import Footer from './components/Footer'
import Divider from './components/Divider'

export default function App() {
  return (
    <div className="font-sans">
      <Nav />
      <Hero />
      <Divider />
      <About />
      <Divider />
      <TheLand />
      {/* <Divider />
      <Contact /> */}
      <Footer />
    </div>
  )
}
