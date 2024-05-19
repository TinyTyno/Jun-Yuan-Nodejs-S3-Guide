import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography } from '@mui/material';
import Upload from './Upload';
import Get from './Get';
import Delete from './Delete';

function App() {
	return (
		<Router>
			<AppBar position="static" className='AppBar'>
				<Container>
					<Toolbar disableGutters={true}>
						<Link to="/">
							<Typography component="div">Upload Image</Typography>
						</Link>
						<Link to="/getImage" >
							<Typography>Get Image</Typography>
						</Link>
						<Link to="/deleteImage">
							<Typography>Delete Image</Typography>
						</Link>
					</Toolbar>
				</Container>
			</AppBar>
			<Container>
				<Routes>
					<Route path={"/"} element={<Upload/>}/>
					<Route path={"/getImage"} element={<Get/>}/>
					<Route path={"/deleteImage"} element={<Delete/>}/>
				</Routes>
			</Container>
		</Router>
	)
}

export default App;