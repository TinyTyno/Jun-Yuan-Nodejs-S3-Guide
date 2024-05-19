import { Box, FormControl, Typography, Input, Button } from '@mui/material'
import { React, useState } from 'react'
import http from '../http'

function Upload() {

    const [img, setImg] = useState();
    const [uuid, setUuid] = useState('');

    const uploadImage = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('image', img);
        await http.post('/upload', formData, { headers: {'Content-Type': 'multipart/form-data'}}).then((res) => {
            setUuid('UUID: ' + res.data);
        });
    }

    return (
        <Box>
            <Typography variant='h1'>
                Upload Image
            </Typography>
            <form onSubmit={uploadImage}>
                <FormControl>
                    <Input type="file" name="image" inputProps={{accept:"image/*"}} onChange={e => setImg(e.target.files[0])}/>
                    <Button type="submit">Upload</Button>
                </FormControl>
            </form>
            <Typography variant='h5'>
                {uuid}
            </Typography>
        </Box>
    )
}

export default Upload
