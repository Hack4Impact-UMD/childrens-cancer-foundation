import { useState, useEffect } from 'react';
import { TextField, Box } from '@mui/material';
import Markdown from 'markdown-to-jsx';
import './Markdown.css';

const MarkdownPreviewer: React.FC<{_previewOnly?: boolean, _text?: string, _minRows?: number}> = ({_previewOnly = false, _text = '', _minRows = 1}) => {
    const [previewOnly, setPreviewOnly] = useState(_previewOnly);
    const [text, setText] = useState(_text);
    useEffect(() => {setPreviewOnly(_previewOnly); }, [_previewOnly]);
    useEffect(() => { setText(_text); }, [_text]);
    const handleTextChange = (e: any) => {
        setText(e.target.value);
    };
    return (
        <Box className="markdown">
            {(!previewOnly) ? (
                <TextField
                label="Enter Markdown"
                value={text}
                multiline
                minRows={_minRows}
                fullWidth
                onChange={handleTextChange}
                variant="outlined"
                sx={{border: 'none', padding: '10px', color: '#666'}}
                className="markdown-input"/>
            ) : (null)}
            <Box className="markdown-previewer">
                <Markdown>
                    {text.split('\n').map((s) => s === '' ? '\n<br>' : s + '\n').join('\n')}
                </Markdown>
            </Box>
        </Box>
    );
};
export default MarkdownPreviewer;
