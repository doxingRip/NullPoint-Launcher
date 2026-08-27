#include <cstdint>
#ifdef _WIN32
#include <windows.h>
#endif

extern "C" {

std::uint64_t nullpoint_total_ram_mb() {
#ifdef _WIN32
    MEMORYSTATUSEX state{};
    state.dwLength = sizeof(state);
    if (GlobalMemoryStatusEx(&state)) return state.ullTotalPhys / (1024ULL * 1024ULL);
#endif
    return 0;
}

}
