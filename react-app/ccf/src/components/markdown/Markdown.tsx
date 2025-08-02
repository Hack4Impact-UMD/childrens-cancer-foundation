import { useState } from 'react';
import { TextField, Box } from '@mui/material';
import Markdown from 'markdown-to-jsx';

const MarkdownPreviewer: React.FC<{_previewOnly?: boolean}> = ({_previewOnly = false}) => {
    const [previewOnly, setPreviewOnly] = useState(_previewOnly);
    const [text, setText] = useState('');
    const handleTextChange = (e: any) => {
        setText(e.target.value);
    };
    return (
        <Box className="markdown">
            {(!previewOnly) ? (
                <TextField
                label="Enter Markdown"
                multiline
                minRows={6}
                fullWidth
                onChange={handleTextChange}
                variant="outlined"
                className="markdown-input"/>
            ) : (null)}
            <Box className="markdown-previewer" sx={{ p: 2, border: '1px solid #ccc', borderRadius: 2, minHeight: 200, background: '#fafafa' }}>
                <Markdown>{text}</Markdown>
            </Box>
        </Box>
    );
};
export default MarkdownPreviewer;