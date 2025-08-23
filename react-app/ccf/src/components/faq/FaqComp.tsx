// import React, { useState } from 'react';
// import './FAQComponent.css';
// import {FAQComponentProps, FAQItem} from "../../types/faqTypes"; // Optional: Add CSS to match the design
// import question from "../../assets/question.png"
//
//
// const FAQComponent: React.FC<FAQComponentProps> = ({ faqs }) => {
//     return (
//         <div className="faq-container">
//             <h2>Frequently Asked Questions</h2>
//             {faqs.map((faq, index) => (
//                 <div key={index} className="faq-item">
//                     <div className="faq-question">
//             <span role="img" aria-label="icon">
//                 {/*change icon later*/}
//               <img src={question} style={{width:"25px"}}/>
//             </span>{' '}
//                         {faq.question}
//                     </div>
//                     <div className="faq-answer">{faq.answer}</div>
//                 </div>
//             ))}
//         </div>
//     );
// };
//
//
// export default FAQComponent;
import React, { useState } from 'react';
import './FAQComponent.css';
import { FAQComponentProps } from '../../types/faqTypes';
import question from '../../assets/question.png';
import MarkdownPreviewer from '../markdown/Markdown';

const FAQComponent: React.FC<FAQComponentProps> = ({ faqs }) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    console.log('FAQComponent received faqs:', faqs);

    const toggleFAQ = (index: number) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <div className="faq-container">
            {/*<h2>Frequently Asked Questions</h2>*/}
            {faqs.length === 0 ? (
                <div className="faq-empty-state">
                    <p>No frequently asked questions available at the moment.</p>
                </div>
            ) : (
                faqs.map((faq, index) => (
                    <div key={index} className="faq-item">
                        <div
                            className="faq-question"
                            onClick={() => toggleFAQ(index)}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'left' }}
                        >
                            <p>
                                <img
                                    src={question}
                                    alt="Question Icon"
                                    style={{
                                        width: '25px',
                                        marginRight: '10px',
                                        transform: activeIndex === index ? 'rotate(90deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.3s',
                                    }}
                                />
                                {faq.question}

                            </p>
                        </div>
                        {activeIndex === index && (
                            <div className="faq-answer">
                                <div className="markdown-preview-light">
                                    <MarkdownPreviewer _text={faq.answer} _previewOnly={true} />
                                </div>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export default FAQComponent;
