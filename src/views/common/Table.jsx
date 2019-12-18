import React          from 'react';
import { Pagination } from 'react-bootstrap';
import ReactTable     from 'react-table-v6';

class CustomPagination extends React.Component
{
    constructor(props)
    {
        super(props);
        this.state = {
            visible_pages: this.GetVisiblePages(0, props.pages)
        }

        this.ChangePage = this.ChangePage.bind(this);
    }

    componentWillReceiveProps(next_props)
    {
        if (this.props.pages !== next_props.pages)
        {
            this.setState({ 
                visible_pages: this.GetVisiblePages(0, next_props.pages) 
            });
        }
    }

    FilterPages(visible_pages, total_pages)
    {
        return visible_pages.filter(page => page <= total_pages);
    }

    GetVisiblePages(page, total)
    {
        page += 1;
        if (total < 6)
        {
            return this.FilterPages([1, 2, 3, 4, 5], total);
        }
        else
        {
            if (page < 5)
            {
                return [1, 2, 3, 4, null];
            }
            else if (page >= 5 && page < total - 3)
            {
                return [null, page-1, page, page+1, null];
            }
            else
            {
                return [null, total-3, total-2, total-1, total];
            }
        }
    }

    GetSafePage(page)
    {
        if (Number.isNaN(page)) { page = this.props.page; }
        return Math.min(Math.max(page, 0), this.props.pages - 1);
    }

    ChangePage(page)
    {
        page = this.GetSafePage(page);
        if (this.props.page === page) { return; }

        const visiblePages = this.GetVisiblePages(page, this.props.pages);
    
        this.setState({
          visible_pages: this.FilterPages(visiblePages, this.props.pages)
        });

        this.props.onPageChange(page);
    }

    render()
    {
        const {
            pages,
            page,
            canPrevious,
            canNext,
        } = this.props;

        const { visible_pages } = this.state;

        return (
            <div className="bg-content border-top d-flex justify-content-between align-items-center">
                <span></span>
                <Pagination className="my-2" size="md">
                    <Pagination.First
                        className="mr-4"
                        onClick={() => {
                            if (!canPrevious) { return; }
                            this.ChangePage(0);
                        }}
                        disabled={!canPrevious}
                    />
                    <Pagination.Prev
                        onClick={() => {
                            if (!canPrevious) { return; }
                            this.ChangePage(page - 1);
                        }}
                        disabled={!canPrevious}
                    />
                    {visible_pages.map((pageNumber, index) => {
                        if (!pageNumber) { return <Pagination.Ellipsis key={`ellipsis${index}`} />; }

                        return (
                            <Pagination.Item
                                key={pageNumber}
                                active={page+1 === pageNumber}
                                onClick={this.ChangePage.bind(null, pageNumber - 1)}
                            >
                                {pageNumber}
                            </Pagination.Item>
                        )
                    })}
                    <Pagination.Next
                        onClick={() => {
                            if (!canNext) { return; }
                            this.ChangePage(page + 1);
                        }}
                        disabled={!canNext}
                    />
                    <Pagination.Last
                        className="ml-4"
                        onClick={() => {
                            if (!canNext) { return; }
                            this.ChangePage(pages - 1);
                        }}
                        disabled={!canNext}
                    />
                </Pagination>
                <span className="mr-5">
                {
                    pages ? `${page+1} / ${pages}` : null
                }
                </span>
            </div>
        );
    }
}

export default Table = (props) =>
{
    return (
        <ReactTable
            paginationComponent={CustomPagination}
            showPagination={props.showPagination}
            pageSizeOptions={[100, 250, 500, 1000]}
            defaultPageSize={500}
            minRows={25}
            filterable={true}
            defaultFilterMethod={(filter, row, column) => {
                const id = filter.pivotId || filter.id
                return row[id] !== undefined ? String(row[id]).toLowerCase().startsWith(filter.value.toLowerCase()) : false
            }}
            noDataText="No events found"
            { ...props }
        />
    );
}
