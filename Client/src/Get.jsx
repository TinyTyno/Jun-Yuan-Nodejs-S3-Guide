import { React, useEffect, useState } from 'react'
import { Img } from 'react-image';
import { Box, Typography, Input, Button, FormControl } from '@mui/material'
import http from '../http'

function Get() {

	const [img, setImg] = useState();
	const [imgName, setName] = useState();
	const [mimeType, setMimeType] = useState();
	const [uuid , setUuid] = useState();

	var getImg = async (e) => {
		e.preventDefault();

		await http.get(`/retrieveOne?uuid=${uuid}`).then((res) => {
			console.log('Data retrieved successfully');
			setImg(res.data.img);
			setName(res.data.name);
			setMimeType(res.data.ContentType);
		});
	}

	return (
		<Box>
			<Typography variant='h1'>
				Get Image
			</Typography>
			<form onSubmit={getImg}>
				<Typography variant='h3' margin='normal'>
					Enter the UUID of the Image you want to get
				</Typography>
				<FormControl>
					<Input type="text" name="uuid" onChange={e => setUuid(e.target.value)}/>
					<Button type="submit">Get</Button>
				</FormControl>
			</form>
			<Typography variant='h3'>
				{imgName}
			</Typography>
			<Img src={`data:${mimeType};base64,${img}`} alt='luffyGear5' />
		</Box>
	)
}

export default Get
