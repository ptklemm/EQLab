import React                 from 'react';
import { Row, Col, Form } from 'react-bootstrap';

export const CCol = (props) =>
{
    return <Col style={{ display: 'flex', justifyContent: 'center' }} {...props}>
              {props.children}
           </Col>
}

export const Checkbox = ({input, meta, md, ...props}) =>
{
    return <Form.Check type="checkbox" checked={!!input.value} {...input} {...props} />
}

export const HInput = ({input, meta, md, ...props}) =>
{
    return (
        <Col md={props.col || null}>
            <Form.Group as={Row}>
                <Form.Label column md={props.labelCol || 4} style={{ textAlign: 'right' }}>{props.label}</Form.Label>
                <Col>
                    <Form.Control
                        size="sm"
                        type={props.type || "text"}
                        value={input.value}
                        isInvalid={meta.invalid}
                        {...input} 
                        {...props}
                    />
                    <Form.Control.Feedback type="invalid">{meta.error}</Form.Control.Feedback>
                </Col>
            </Form.Group>
        </Col>
    );
}

export const HSelect = ({input, meta, md, ...props}) =>
{
    return (
        <Col md={props.col || null}>
            <Form.Group as={Row}>
                <Form.Label column md={props.labelCol || 4} style={{ textAlign: 'right' }}>{props.label}</Form.Label>
                <Col>
                    <Form.Control style={{ padding: 2 }} as="select" size="sm" value={input.value} {...input} {...props}>
                        {props.usePlaceholder && <option key={0} value={0}></option>}
                        {props.options.map((option, index) => {
                            return <option key={index} value={option.value}>{option.label}</option>
                        })}
                    </Form.Control>
                </Col>
            </Form.Group>
        </Col>
    );
}
