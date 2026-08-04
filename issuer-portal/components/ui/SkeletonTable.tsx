import {
  Card,
  CardHeader,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "@mui/material";

interface SkeletonTableProps {
  readonly count?: number;
  readonly rows?: number;
  readonly columns?: number;
}

const SkeletonTable = ({ rows = 4, columns = 2 }: SkeletonTableProps) => {
  return (
    <Card>
      <CardHeader title={<Skeleton variant="text" width="40%" height={30} />} />
      <TableContainer>
        <Table>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <TableCell key={colIndex} sx={{ py: 2 }}>
                    <Skeleton variant="rectangular" width="100%" height={20} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default SkeletonTable;
