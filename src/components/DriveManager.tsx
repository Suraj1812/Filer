"use client";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import DriveFileMoveIcon from "@mui/icons-material/DriveFileMove";
import FolderIcon from "@mui/icons-material/Folder";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import ShareIcon from "@mui/icons-material/Share";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VideoFileIcon from "@mui/icons-material/VideoFile";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  LinearProgress,
  Link as MuiLink,
  Menu,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  isDriveFolder,
  type DriveFile,
  type DriveListView,
} from "@/lib/drive-shared";

type DriveResponse = {
  files: DriveFile[];
  nextPageToken: string | null;
};

type DriveManagerProps = {
  title: string;
  view?: DriveListView;
};

type FolderCrumb = {
  id: string;
  name: string;
};

type FolderForm = {
  name: string;
};

type RenameForm = {
  name: string;
};

type MoveForm = {
  toFolderId: string;
};

type ShareForm = {
  anyone: boolean;
  email: string;
};

const rootFolder: FolderCrumb = { id: "root", name: "My Drive" };

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers:
      init?.body instanceof FormData
        ? init.headers
        : {
            "Content-Type": "application/json",
            ...init?.headers,
          },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error ?? "Request failed");
  }

  return payload as T;
}

function useDebouncedValue(value: string, delay = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}

function formatBytes(value?: string | null) {
  if (!value) {
    return "-";
  }

  const bytes = Number(value);

  if (!Number.isFinite(bytes)) {
    return "-";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unit = 0;

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }

  return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function FileIcon({ file }: { file: DriveFile }) {
  if (isDriveFolder(file)) {
    return <FolderIcon color="secondary" />;
  }

  if (file.mimeType.includes("pdf")) {
    return <PictureAsPdfIcon color="error" />;
  }

  if (file.mimeType.startsWith("image/")) {
    return <ImageIcon color="primary" />;
  }

  if (file.mimeType.startsWith("video/")) {
    return <VideoFileIcon color="primary" />;
  }

  if (file.mimeType.includes("document")) {
    return <DescriptionIcon color="primary" />;
  }

  return <InsertDriveFileIcon color="action" />;
}

export function DriveManager({ title, view = "all" }: DriveManagerProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [path, setPath] = useState<FolderCrumb[]>([rootFolder]);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const currentFolder = path[path.length - 1];
  const queryKey = ["drive-files", currentFolder.id, debouncedSearch, view];

  const filesQuery = useQuery({
    queryFn: async () => {
      const params = new URLSearchParams({
        folderId: currentFolder.id,
        view,
      });

      if (debouncedSearch) {
        params.set("q", debouncedSearch);
      }

      return apiJson<DriveResponse>(`/api/drive/list?${params.toString()}`);
    },
    queryKey,
  });

  const folderForm = useForm<FolderForm>({ defaultValues: { name: "" } });
  const renameForm = useForm<RenameForm>({ defaultValues: { name: "" } });
  const moveForm = useForm<MoveForm>({
    defaultValues: { toFolderId: "root" },
  });
  const shareForm = useForm<ShareForm>({
    defaultValues: { anyone: true, email: "" },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList | File[]) => {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("files", file));
      formData.append("folderId", currentFolder.id);

      return apiJson<{ files: DriveFile[] }>("/api/drive/upload", {
        body: formData,
        method: "POST",
      });
    },
    onSuccess: invalidate,
  });

  const createFolderMutation = useMutation({
    mutationFn: (input: FolderForm) =>
      apiJson<{ file: DriveFile }>("/api/drive/folder", {
        body: JSON.stringify({ ...input, parentId: currentFolder.id }),
        method: "POST",
      }),
    onSuccess: () => {
      folderForm.reset();
      setFolderDialogOpen(false);
      invalidate();
    },
  });

  const renameMutation = useMutation({
    mutationFn: (input: RenameForm) =>
      apiJson<{ file: DriveFile }>("/api/drive/rename", {
        body: JSON.stringify({ fileId: selectedFile?.id, name: input.name }),
        method: "POST",
      }),
    onSuccess: () => {
      setRenameDialogOpen(false);
      setSelectedFile(null);
      invalidate();
    },
  });

  const moveMutation = useMutation({
    mutationFn: (input: MoveForm) =>
      apiJson<{ file: DriveFile }>("/api/drive/move", {
        body: JSON.stringify({
          fileId: selectedFile?.id,
          name: selectedFile?.name,
          toFolderId: input.toFolderId || "root",
        }),
        method: "POST",
      }),
    onSuccess: () => {
      setMoveDialogOpen(false);
      setSelectedFile(null);
      invalidate();
    },
  });

  const shareMutation = useMutation({
    mutationFn: (input: ShareForm) =>
      apiJson<{ file: DriveFile }>("/api/drive/share", {
        body: JSON.stringify({
          anyone: input.anyone,
          email: input.email,
          fileId: selectedFile?.id,
          name: selectedFile?.name,
        }),
        method: "POST",
      }),
    onSuccess: ({ file }) => {
      setShareDialogOpen(false);
      setSelectedFile(file);
      navigator.clipboard?.writeText(file.webViewLink ?? "");
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      apiJson<{ file: DriveFile }>("/api/drive/delete", {
        body: JSON.stringify({
          fileId: selectedFile?.id,
          name: selectedFile?.name,
        }),
        method: "POST",
      }),
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setSelectedFile(null);
      invalidate();
    },
  });

  const mutationError =
    uploadMutation.error ??
    createFolderMutation.error ??
    renameMutation.error ??
    moveMutation.error ??
    shareMutation.error ??
    deleteMutation.error;
  const visibleError = (mutationError ?? filesQuery.error) as Error | null;
  const shouldReconnect =
    visibleError?.message.includes("Google Drive needs reconnecting") ||
    visibleError?.message.includes("unregistered callers") ||
    visibleError?.message.includes("consumer identity");

  const openMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    file: DriveFile,
  ) => {
    setMenuAnchor(event.currentTarget);
    setSelectedFile(file);
  };

  const closeMenu = () => setMenuAnchor(null);

  const openFolder = (folder: DriveFile) => {
    if (!isDriveFolder(folder)) {
      return;
    }

    setPath((current) => [...current, { id: folder.id, name: folder.name }]);
    setSearch("");
  };

  const jumpToCrumb = (index: number) => {
    setPath((current) => current.slice(0, index + 1));
  };

  const handleUpload = (files: FileList | null) => {
    if (files?.length) {
      uploadMutation.mutate(files);
    }
  };

  const isMutating =
    uploadMutation.isPending ||
    createFolderMutation.isPending ||
    renameMutation.isPending ||
    moveMutation.isPending ||
    shareMutation.isPending ||
    deleteMutation.isPending;

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={2}
          sx={{ alignItems: { lg: "center" }, justifyContent: "space-between" }}
        >
          <Box>
            <Typography component="h1" variant="h4">
              {title}
            </Typography>
            <Breadcrumbs sx={{ mt: 1 }}>
              {path.map((crumb, index) => (
                <MuiLink
                  component="button"
                  key={crumb.id}
                  onClick={() => jumpToCrumb(index)}
                  sx={{ cursor: "pointer" }}
                  type="button"
                  underline={index === path.length - 1 ? "none" : "hover"}
                >
                  {crumb.name}
                </MuiLink>
              ))}
            </Breadcrumbs>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search files"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                },
              }}
              size="small"
              value={search}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              startIcon={<CloudUploadIcon />}
              variant="contained"
            >
              Upload
            </Button>
            <Button
              onClick={() => setFolderDialogOpen(true)}
              startIcon={<FolderIcon />}
              variant="outlined"
            >
              New folder
            </Button>
            <Tooltip title="Refresh">
              <IconButton aria-label="Refresh" onClick={() => filesQuery.refetch()}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <input
          hidden
          multiple
          onChange={(event) => handleUpload(event.target.files)}
          ref={fileInputRef}
          type="file"
        />

        <Paper
          elevation={0}
          onDragLeave={() => setDragActive(false)}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            handleUpload(event.dataTransfer.files);
          }}
          sx={{
            border: "1px dashed",
            borderColor: dragActive ? "primary.main" : "divider",
            p: 2,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <UploadFileIcon color="primary" />
              <Box>
                <Typography variant="body2">Drop files here</Typography>
                <Typography color="text.secondary" variant="caption">
                  Stored in {currentFolder.name}
                </Typography>
              </Box>
            </Stack>
            {uploadMutation.isPending && (
              <Chip color="primary" label="Uploading" size="small" />
            )}
          </Stack>
        </Paper>

        {isMutating && <LinearProgress />}

        {visibleError && (
          <Alert
            action={
              shouldReconnect ? (
                <Button
                  color="inherit"
                  onClick={() =>
                    signIn("google", {
                      callbackUrl: window.location.pathname,
                    })
                  }
                  size="small"
                >
                  Reconnect
                </Button>
              ) : undefined
            }
            severity="error"
          >
            {visibleError.message}
          </Alert>
        )}

        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            overflowX: "auto",
          }}
        >
          <Table sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Modified</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filesQuery.isLoading &&
                Array.from({ length: 6 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={5}>
                      <Skeleton height={32} />
                    </TableCell>
                  </TableRow>
                ))}

              {!filesQuery.isLoading &&
                filesQuery.data?.files.map((file) => (
                  <TableRow hover key={file.id}>
                    <TableCell>
                      <Stack
                        direction="row"
                        spacing={1.5}
                        sx={{ alignItems: "center", minWidth: 0 }}
                      >
                        <FileIcon file={file} />
                        {isDriveFolder(file) ? (
                          <MuiLink
                            component="button"
                            onClick={() => openFolder(file)}
                            sx={{
                              cursor: "pointer",
                              font: "inherit",
                              minWidth: 0,
                              overflowWrap: "anywhere",
                              textAlign: "left",
                            }}
                            type="button"
                          >
                            {file.name}
                          </MuiLink>
                        ) : (
                          <Typography sx={{ overflowWrap: "anywhere" }}>
                            {file.name}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {isDriveFolder(file) ? "Folder" : file.mimeType}
                    </TableCell>
                    <TableCell>{formatBytes(file.size)}</TableCell>
                    <TableCell>{formatDate(file.modifiedTime)}</TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ justifyContent: "flex-end" }}
                      >
                        {file.webViewLink && (
                          <Tooltip title="Open in Google Drive">
                            <IconButton
                              aria-label="Open in Google Drive"
                              component="a"
                              href={file.webViewLink}
                              rel="noreferrer"
                              target="_blank"
                            >
                              <InsertDriveFileIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {!isDriveFolder(file) && (
                          <Tooltip title="Download">
                            <IconButton
                              aria-label="Download"
                              component="a"
                              href={`/api/drive/download?fileId=${encodeURIComponent(
                                file.id,
                              )}`}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="More actions">
                          <IconButton
                            aria-label={`Actions for ${file.name}`}
                            onClick={(event) => openMenu(event, file)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}

              {!filesQuery.isLoading && !filesQuery.data?.files.length && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Box sx={{ py: 7, textAlign: "center" }}>
                      <Typography color="text.secondary">
                        No files found.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>

      <Menu anchorEl={menuAnchor} onClose={closeMenu} open={Boolean(menuAnchor)}>
        <MenuItem
          onClick={() => {
            closeMenu();
            renameForm.reset({ name: selectedFile?.name ?? "" });
            setRenameDialogOpen(true);
          }}
        >
          Rename
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            moveForm.reset({ toFolderId: "root" });
            setMoveDialogOpen(true);
          }}
        >
          <DriveFileMoveIcon fontSize="small" sx={{ mr: 1 }} />
          Move
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            shareForm.reset({ anyone: true, email: "" });
            setShareDialogOpen(true);
          }}
        >
          <ShareIcon fontSize="small" sx={{ mr: 1 }} />
          Share
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            setDeleteDialogOpen(true);
          }}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      <Dialog
        fullWidth
        maxWidth="xs"
        onClose={() => setFolderDialogOpen(false)}
        open={folderDialogOpen}
      >
        <form onSubmit={folderForm.handleSubmit((data) => createFolderMutation.mutate(data))}>
          <DialogTitle>New folder</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              label="Folder name"
              margin="dense"
              {...folderForm.register("name", { required: true })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFolderDialogOpen(false)}>Cancel</Button>
            <Button disabled={createFolderMutation.isPending} type="submit">
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="xs"
        onClose={() => setRenameDialogOpen(false)}
        open={renameDialogOpen}
      >
        <form onSubmit={renameForm.handleSubmit((data) => renameMutation.mutate(data))}>
          <DialogTitle>Rename</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              label="Name"
              margin="dense"
              {...renameForm.register("name", { required: true })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
            <Button disabled={renameMutation.isPending} type="submit">
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={() => setMoveDialogOpen(false)}
        open={moveDialogOpen}
      >
        <form onSubmit={moveForm.handleSubmit((data) => moveMutation.mutate(data))}>
          <DialogTitle>Move</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              helperText="Use root or a Google Drive folder ID."
              label="Destination folder ID"
              margin="dense"
              {...moveForm.register("toFolderId", { required: true })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMoveDialogOpen(false)}>Cancel</Button>
            <Button disabled={moveMutation.isPending} type="submit">
              Move
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={() => setShareDialogOpen(false)}
        open={shareDialogOpen}
      >
        <form onSubmit={shareForm.handleSubmit((data) => shareMutation.mutate(data))}>
          <DialogTitle>Share</DialogTitle>
          <DialogContent>
            <Controller
              control={shareForm.control}
              name="anyone"
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  }
                  label="Anyone with the link"
                />
              )}
            />
            <TextField
              disabled={shareForm.watch("anyone")}
              fullWidth
              label="Email"
              margin="dense"
              type="email"
              {...shareForm.register("email")}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
            <Button disabled={shareMutation.isPending} type="submit">
              Share
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="xs"
        onClose={() => setDeleteDialogOpen(false)}
        open={deleteDialogOpen}
      >
        <DialogTitle>Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Move {selectedFile?.name ?? "this item"} to Google Drive trash?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            color="error"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
