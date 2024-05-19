import { React, useState } from 'react'
import { Box, Typography, FormControl, Input, Button } from '@mui/material'
import http from '../http'


function Delete() {

    const [resMsg, setResMsg] = useState('');
    const [uuid, setUuid] = useState();

    const deleteImg = async (e) => {
        e.preventDefault();
        await http.post(`/delete?uuid=${uuid}`).then((res) => {
            setResMsg('Image deleted successfully');
        });
    }

    return (
        <Box>
            <Typography variant='h1'>
                Delete Image
            </Typography>
            <form onSubmit={deleteImg}>
                <Typography variant='h3' margin='normal'>
                    Enter the UUID of the Image you want to delete
                </Typography>
                <FormControl>
                    <Input type="text" name="uuid" onChange={e => setUuid(e.target.value)} />
                    <Button type="submit">Delete</Button>
                </FormControl>
            </form>
            {resMsg}
        </Box>
    )
}

export default Delete
