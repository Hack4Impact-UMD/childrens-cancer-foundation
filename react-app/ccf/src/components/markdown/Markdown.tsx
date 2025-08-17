import { useState, useEffect } from 'react';
import { TextField, Box } from '@mui/material';
import Markdown from 'markdown-to-jsx';
import './Markdown.css';

type MarkdownPreviewerProps = {
    _previewOnly?: boolean;
    _text?: string;
    _minRows?: number;
    onChange?: (text: string) => void;
};

const MarkdownPreviewer: React.FC<MarkdownPreviewerProps> = ({_previewOnly = false, _text = '', _minRows = 1, onChange}) => {
    const [previewOnly, setPreviewOnly] = useState(_previewOnly);
    const [text, setText] = useState(_text);
    useEffect(() => { setPreviewOnly(_previewOnly); }, [_previewOnly]);
    useEffect(() => { setText(_text); }, [_text]);
    const handleTextChange = (e: any) => {
        const newText = e.target.value;
        setText(newText);
    };

    // notify parent when text changes
    useEffect(() => {
        if (onChange) onChange(text);
    }, [text, onChange]);
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
