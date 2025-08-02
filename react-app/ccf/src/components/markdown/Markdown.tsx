import { useState } from 'react';
import { TextField, Box } from '@mui/material';
import Markdown from 'markdown-to-jsx';

const MarkdownPreviewer: React.FC<{_previewOnly?: boolean, _text?: string, _minRows?: number}> = ({_previewOnly = false, _text = '', _minRows = 1}) => {
    const [previewOnly, setPreviewOnly] = useState(_previewOnly);
    const [text, setText] = useState(_text);
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
                className="markdown-input"/>
            ) : (null)}
            <Box className="markdown-previewer" sx={{ p: 2, border: '1px solid #ccc', borderRadius: 2, background: '#fafafa' }}>
                <Markdown>{text.trim().replaceAll('\n', '\n<br>')}</Markdown>
            </Box>
        </Box>
    );
};
export default MarkdownPreviewer;